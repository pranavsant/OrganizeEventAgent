export type CampaignTarget = {
    id: string;
    name: string;
    phone: string;
    status: 'pending' | 'called' | 'approved' | 'rejected' | 'escalated';
    notes?: string;
};

export type CampaignEvent = {
    id: string;
    timestamp: string;
    type: 'call_started' | 'call_completed' | 'voicemail' | 'negotiation' | 'approval_requested' | 'system';
    targetId?: string;
    details: string;
    recommendedAction?: string;
};

export type ApprovalRequest = {
    id: string;
    campaignId: string;
    targetId: string;
    targetName: string;
    type: 'book' | 'purchase' | 'followup' | 'escalate';
    details: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: string;
};

export type Campaign = {
    id: string;
    goal: string;
    constraints: string;
    scriptTemplate?: string;
    status: 'planning' | 'running' | 'paused' | 'completed';
    targets: CampaignTarget[];
    timeline: CampaignEvent[];
    approvals: ApprovalRequest[];
    createdAt: string;
};

// Simple in-memory store
class Store {
    private campaigns: Map<string, Campaign> = new Map();

    createCampaign(goal: string, constraints: string): Campaign {
        const id = Math.random().toString(36).substring(7);
        const campaign: Campaign = {
            id,
            goal,
            constraints,
            status: 'planning',
            targets: [],
            timeline: [{
                id: Math.random().toString(36).substring(7),
                timestamp: new Date().toISOString(),
                type: 'system',
                details: 'Campaign created',
            }],
            approvals: [],
            createdAt: new Date().toISOString(),
        };
        this.campaigns.set(id, campaign);
        return campaign;
    }

    getCampaign(id: string): Campaign | undefined {
        return this.campaigns.get(id);
    }

    updateCampaign(id: string, updates: Partial<Campaign>): Campaign | undefined {
        const campaign = this.campaigns.get(id);
        if (!campaign) return undefined;
        const updated = { ...campaign, ...updates };
        this.campaigns.set(id, updated);
        return updated;
    }

    getAllCampaigns(): Campaign[] {
        return Array.from(this.campaigns.values()).sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
}

export const store = new Store();
