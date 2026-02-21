import { MCPServer, object, text, widget } from "mcp-use/server";
import { z } from "zod";
import { store, Campaign, CampaignTarget, CampaignEvent, ApprovalRequest } from "./store";

const server = new MCPServer({
  name: "OpsDock",
  title: "OpsDock Mission Control",
  version: "1.0.0",
  description: "Operations console for chat-native human-in-the-loop calling and tasks.",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "favicon.ico",
  websiteUrl: "https://mcp-use.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
});

// Tool: Create Campaign
server.tool(
  {
    name: "create_campaign",
    description: "Initialize a new calling campaign with a specific goal. This must be the first step.",
    schema: z.object({
      goal: z.string().describe("The primary objective of the campaign (e.g., 'Book a venue for 30 people under $4000')"),
      constraints: z.string().describe("Key constraints like budget, time, or rules."),
    }),
    widget: {
      name: "opsdock-dashboard",
      invoking: "Initializing OpsDock...",
      invoked: "OpsDock active."
    }
  },
  async ({ goal, constraints }) => {
    const campaign = store.createCampaign(goal, constraints);

    // Auto-populate some mock targets based on the goal (for the demo)
    const mockTargets: CampaignTarget[] = [
      { id: "t1", name: "Berkeley City Club", phone: "555-0101", status: "pending" },
      { id: "t2", name: "The Faculty Club", phone: "555-0102", status: "pending" },
      { id: "t3", name: "DoubleTree Berkeley", phone: "555-0103", status: "pending" },
    ];

    campaign.targets = mockTargets;

    return widget({
      props: { campaignId: campaign.id, campaign },
      output: text(`Campaign generated with ID: ${campaign.id}. Goal: ${goal}.`)
    });
  }
);

// Tool: Search Targets (adds targets)
server.tool(
  {
    name: "search_targets",
    description: "Search for more venues/companies and add them to the campaign targets list.",
    schema: z.object({
      campaignId: z.string().describe("The ID of the campaign to add targets to"),
      query: z.string().describe("Search keywords"),
    }),
  },
  async ({ campaignId, query }) => {
    const campaign = store.getCampaign(campaignId);
    if (!campaign) return text("Error: Campaign not found.");

    const newTarget: CampaignTarget = {
      id: `t${Math.random().toString(36).substring(7)}`,
      name: `Search result: ${query} Venue`,
      phone: "555-" + Math.floor(Math.random() * 9000 + 1000),
      status: 'pending'
    };

    campaign.targets.push(newTarget);

    return object({
      message: `Added ${newTarget.name} to the target list.`,
      newTarget
    });
  }
);

// Tool: Generate Script
server.tool(
  {
    name: "generate_script",
    description: "Generate or update the call script for the agents.",
    schema: z.object({
      campaignId: z.string().describe("Campaign ID"),
      scriptText: z.string().describe("The text of the script to use for calls."),
    }),
  },
  async ({ campaignId, scriptText }) => {
    const campaign = store.getCampaign(campaignId);
    if (!campaign) return text("Error: Campaign not found.");

    campaign.scriptTemplate = scriptText;

    return text("Script updated successfully.");
  }
);

// Tool: Run Next Call
server.tool(
  {
    name: "run_next_call",
    description: "Initiate the next pending call in the campaign. Will simulate a call sequence.",
    schema: z.object({
      campaignId: z.string().describe("Campaign ID"),
    }),
    widget: {
      name: "opsdock-dashboard",
      invoking: "Executing call protocol...",
      invoked: "Call completed."
    }
  },
  async ({ campaignId }) => {
    const campaign = store.getCampaign(campaignId);
    if (!campaign) return text("Error: Campaign not found.");

    // Find first pending target
    const target = campaign.targets.find(t => t.status === 'pending');
    if (!target) return text("No pending targets left.");

    // Update target status
    target.status = 'called';

    // Simulating call results
    // We will ask for an approval directly to demo the feature
    const isSuccess = Math.random() > 0.5;

    const event: CampaignEvent = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type: 'call_completed',
      targetId: target.id,
      details: isSuccess
        ? `Reached manager at ${target.name}. They have availability but require a $500 deposit.`
        : `Reached voicemail at ${target.name}. Leaving a message.`,
      recommendedAction: isSuccess ? "Request user approval to book with deposit" : "Follow up tomorrow"
    };

    campaign.timeline.unshift(event);

    if (isSuccess) {
      target.status = 'escalated';
      const approval: ApprovalRequest = {
        id: Math.random().toString(36).substring(7),
        campaignId,
        targetId: target.id,
        targetName: target.name,
        type: 'book',
        details: 'Manager requires a $500 deposit to secure the date.',
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      campaign.approvals.unshift(approval);
    }

    return widget({
      props: { campaignId, campaign },
      output: object({
        outcome: event.details,
        actionRequired: isSuccess ? "Approval required to book" : "None"
      }),
      message: `Call to ${target.name} completed. ${event.details}`
    });
  }
);

// Tool: Approve Action
server.tool(
  {
    name: "approve_action",
    description: "Approve a pending action in the campaign (e.g., booking, follow-up).",
    schema: z.object({
      campaignId: z.string().describe("Campaign ID"),
      approvalId: z.string().describe("Approval Request ID"),
      decision: z.enum(['approve', 'reject']).describe("Decision to make (approve or reject)"),
    }),
    widget: {
      name: "opsdock-dashboard",
      invoking: "Processing approval...",
      invoked: "Approval processed."
    }
  },
  async ({ campaignId, approvalId, decision }) => {
    const campaign = store.getCampaign(campaignId);
    if (!campaign) return text("Error: Campaign not found.");

    const approval = campaign.approvals.find(a => a.id === approvalId);
    if (!approval) return text("Error: Approval request not found.");

    approval.status = decision === 'approve' ? 'approved' : 'rejected';

    const target = campaign.targets.find(t => t.id === approval.targetId);
    if (target) {
      target.status = decision === 'approve' ? 'approved' : 'rejected';
    }

    campaign.timeline.unshift({
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type: 'system',
      targetId: target?.id,
      details: `User ${decision}d action for ${target?.name || 'target'}.`
    });

    return widget({
      props: { campaignId, campaign },
      output: text(`Action ${decision}d successfully.`)
    });
  }
);


// Resource: Get Campaign state - Temporarily disabled due to resource parsing error
/*
server.resource(
  "campaign",
  "campaigns://{campaignId}",
  async (uri: URL, variables: Record<string, unknown>) => {
    const campaignId = variables.campaignId as string;
    const campaign = store.getCampaign(campaignId);
    if (!campaign) throw new Error("Campaign not found");
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(campaign)
      }]
    };
  }
);
*/


server.listen().then(() => {
  console.log(`Server running`);
});
