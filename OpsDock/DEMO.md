# OpsDock Demo Instructions

This guide provides the exact steps to demo OpsDock as an MCP App inside ChatGPT (or any MCP App compatible host).

## Prerequisites
1. Run the OpsDock server locally: `npm run dev`
2. Connect the local server to your chat client using the `mcp-use` CLI inspector or connect it directly via MCP configuration to ChatGPT.

## Demo Script

**1. Creating the Campaign**
- **User Types:** "Book me a 30-person venue in Berkeley under $4,000 for March 20."
- **Model Action:** The model will call the `create_campaign` tool securely with the parsed goal and constraints.
- **Widget Output:** The `OpsDock Console` widget will appear in chat showing:
  - The "Call Plan" tab populated with branching logic.
  - The "Targets" tab pre-populated with 3 Berkeley venues.

**2. Running the First Call**
- **User Action:** Clicks the **"Run Next Call"** button in the widget header.
- **Widget Action:** 
  - The widget directly triggers the `run_next_call` tool execution.
  - The "Live Timeline" tab updates automatically with a completed call event.
  - Depending on the mock outcome, the item may escalate to the "Approvals" tab.

**3. Handling an Approval**
- **User Action:** Navigate to the "Approvals" tab.
- **User View:** A warning card will display (e.g. "Manager requires a $500 deposit").
- **User Action:** Clicks **"Approve Action"** or **"Reject / Skip"**.
- **Widget Action:** The timeline is updated showing the human-in-the-loop decision, and the target's status is changed securely.

**4. Adding More Targets**
- **User Action:** Navigate to the "Targets" tab and type "Hotel" in the search input.
- **User Action:** Click "Add Targets".
- **Widget Action:** The list updates instantly with a new pending target ready to be called.

**5. Teach Mode**
- **User Action:** Navigate to the "Teach Mode" tab.
- **User View:** Shows the dynamic rule-building UI where a user can define constraints for the AI operator playbook.

## Why this demonstrates MCP Apps perfectly:
- **Interactive UI**: Real-time state updates (tabs, buttons, tables) inside chat.
- **Client-to-Server Tool Calls**: The widget calls the backend securely (`useCallTool`), bypassing the LLM when appropriate.
- **Human-in-the-Loop**: Approval gates handled via the widget block automatic agent execution until explicit user consent is given.
- **Model Coordination**: The LLM handles the initial unstructured input and parsing, while the widget handles the deterministic stateful operations dashboard.
