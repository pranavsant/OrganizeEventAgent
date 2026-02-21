import { useWidgetTheme, useCallTool } from "mcp-use/client";
import { Campaign, CampaignTarget, CampaignEvent, ApprovalRequest } from "../../src/store";
import { useState } from "react";

type OpsDockDashboardProps = {
    campaignId?: string;
    campaign?: Campaign;
};

export default function OpsDockDashboard({ campaignId, campaign }: OpsDockDashboardProps) {
    const { theme } = useWidgetTheme();
    const [activeTab, setActiveTab] = useState<'plan' | 'targets' | 'timeline' | 'approvals' | 'teach'>('timeline');
    const [searchQuery, setSearchQuery] = useState('');

    // Tool hooks
    const { callTool: runNextCall, isPending: isCalling } = useCallTool({ name: "run_next_call" });
    const { callTool: searchTargets, isPending: isSearching } = useCallTool({ name: "search_targets" });
    const { callTool: approveAction, isPending: isApproving } = useCallTool({ name: "approve_action" });
    const { callTool: generateScript, isPending: isScripting } = useCallTool({ name: "generate_script" });

    if (!campaign) {
        return (
            <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#1a1a1a] text-white border-gray-800' : 'bg-white text-gray-900 border-gray-200'}`}>
                <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    OpsDock initialized. Create a campaign to begin.
                </div>
            </div>
        );
    }

    const handleNextCall = () => {
        runNextCall({ campaignId });
    };

    const handleSearchTargets = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        searchTargets({ campaignId, query: searchQuery });
        setSearchQuery('');
    };

    const handleApproval = (approvalId: string, decision: 'approve' | 'reject') => {
        approveAction({ campaignId, approvalId, decision });
    };

    const tabs = [
        { id: 'plan', label: 'Call Plan' },
        { id: 'targets', label: `Targets (${campaign.targets.length})` },
        { id: 'timeline', label: 'Live Timeline' },
        { id: 'approvals', label: `Approvals (${campaign.approvals.filter(a => a.status === 'pending').length})` },
        { id: 'teach', label: 'Teach Mode' },
    ];

    return (
        <div className={`w-full max-w-4xl mx-auto rounded-2xl shadow-xl overflow-hidden font-sans border flex flex-col h-[600px]
      ${theme === 'dark' ? 'bg-[#111111] text-gray-100 border-gray-800 shadow-black/50' : 'bg-white text-gray-900 border-gray-200'}`}>

            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${theme === 'dark' ? 'border-gray-800 bg-[#1a1a1a]' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        ⚡
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">OpsDock Console</h1>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Campaign: {campaign.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider
            ${campaign.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            campaign.status === 'planning' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {campaign.status}
                    </span>
                    <button
                        onClick={handleNextCall}
                        disabled={isCalling || campaign.targets.every(t => t.status !== 'pending')}
                        className={`px-4 py-2 font-semibold text-sm rounded-lg transition-all
              ${isCalling ? 'opacity-50 cursor-wait bg-blue-600/50' :
                                'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95'}`}
                    >
                        {isCalling ? 'Executing...' : 'Run Next Call'}
                    </button>
                </div>
            </div>

            {/* Goal Banner */}
            <div className={`px-6 py-3 border-b text-sm font-medium ${theme === 'dark' ? 'border-gray-800 bg-[#161616]' : 'border-gray-100 bg-blue-50/50'}`}>
                <span className="opacity-70 mr-2">Goal:</span> {campaign.goal}
            </div>

            {/* Tabs */}
            <div className={`flex px-4 border-b overflow-x-auto hide-scrollbar ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 
              ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-transparent">

                {/* TAB: TIMELINE */}
                {activeTab === 'timeline' && (
                    <div className="space-y-4">
                        {campaign.timeline.length === 0 ? (
                            <div className="text-center py-12 opacity-50">No events yet.</div>
                        ) : (
                            campaign.timeline.map((event, i) => (
                                <div key={event.id} className="relative pl-8 pb-4">
                                    {/* Timeline connector */}
                                    {i !== campaign.timeline.length - 1 && (
                                        <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                                    )}

                                    {/* Timeline dot */}
                                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm
                    ${event.type === 'call_completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400' :
                                            event.type === 'system' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'}`}>
                                        {event.type === 'call_completed' ? '✓' : event.type === 'system' ? '⚙' : '•'}
                                    </div>

                                    {/* Event Card */}
                                    <div className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md
                    ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-100'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold uppercase tracking-wider opacity-60">
                                                {event.type.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs opacity-50">
                                                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm leading-relaxed">{event.details}</p>

                                        {event.recommendedAction && (
                                            <div className={`mt-3 p-3 rounded-lg text-sm border-l-2
                        ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
                                                <span className="font-semibold mr-2 opacity-80">Next Step:</span>
                                                {event.recommendedAction}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TAB: APPROVALS */}
                {activeTab === 'approvals' && (
                    <div className="space-y-4">
                        {campaign.approvals.filter(a => a.status === 'pending').length === 0 ? (
                            <div className="text-center py-12 opacity-50">No pending approvals.</div>
                        ) : (
                            campaign.approvals.filter(a => a.status === 'pending').map(approval => (
                                <div key={approval.id} className={`p-5 rounded-xl border shadow-sm flex flex-col gap-4
                  ${theme === 'dark' ? 'bg-[#1a1a1a] border-orange-900/30' : 'bg-white border-orange-100'}`}>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 flex items-center justify-center text-xl">
                                            ⚠️
                                        </div>
                                        <div>
                                            <h3 className="font-bold">Approval Required: {approval.type.toUpperCase()}</h3>
                                            <p className="text-sm opacity-70">Target: {approval.targetName}</p>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-lg text-sm leading-relaxed ${theme === 'dark' ? 'bg-black/20' : 'bg-gray-50'}`}>
                                        {approval.details}
                                    </div>

                                    <div className="flex gap-3 justify-end mt-2">
                                        <button
                                            onClick={() => handleApproval(approval.id, 'reject')}
                                            disabled={isApproving}
                                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors
                        ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                        >
                                            Reject / Skip
                                        </button>
                                        <button
                                            onClick={() => handleApproval(approval.id, 'approve')}
                                            disabled={isApproving}
                                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white shadow"
                                        >
                                            Approve Action
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* TAB: TARGETS */}
                {activeTab === 'targets' && (
                    <div className="space-y-6">
                        <form onSubmit={handleSearchTargets} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search new targets to add..."
                                className={`flex-1 px-4 py-2 rounded-lg border text-sm outline-none transition-colors
                  ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'}`}
                            />
                            <button
                                type="submit"
                                disabled={isSearching || !searchQuery}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                            >
                                {isSearching ? 'Searching...' : 'Add Targets'}
                            </button>
                        </form>

                        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
                            <table className="w-full text-sm text-left">
                                <thead className={`text-xs uppercase ${theme === 'dark' ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Name</th>
                                        <th className="px-5 py-3 font-semibold">Phone</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {campaign.targets.map(target => (
                                        <tr key={target.id} className={`transition-colors hover:bg-black/5 dark:hover:bg-white/5`}>
                                            <td className="px-5 py-3 font-medium">{target.name}</td>
                                            <td className="px-5 py-3 font-mono text-xs opacity-70">{target.phone}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-md
                           ${target.status === 'pending' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                                                        target.status === 'called' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            target.status === 'approved' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                                target.status === 'escalated' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                                                                    'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {target.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: PLAN */}
                {activeTab === 'plan' && (
                    <div className="space-y-6">
                        <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-100'}`}>
                            <h3 className="font-bold mb-3 flex items-center gap-2"><span className="text-xl">📋</span> Rules & Constraints</h3>
                            <p className="text-sm opacity-80 leading-relaxed">{campaign.constraints}</p>
                        </div>

                        <div className={`p-5 rounded-xl border shadow-sm ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' : 'bg-white border-gray-100'}`}>
                            <h3 className="font-bold mb-3 flex items-center gap-2"><span className="text-xl">🔀</span> Branching Logic</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex gap-3 items-start"><span className="opacity-50">→</span> <strong>If Voicemail:</strong> Leave standard callback message and schedule follow-up for tomorrow.</li>
                                <li className="flex gap-3 items-start"><span className="opacity-50">→</span> <strong>If Available:</strong> Verify constraints (budget, capacity).</li>
                                <li className="flex gap-3 items-start"><span className="opacity-50">→</span> <strong>If Over Budget:</strong> Attempt to negotiate down to {campaign.constraints.match(/\$\d+/)?.[0] || 'budget'}.</li>
                                <li className="flex gap-3 items-start"><span className="opacity-50">→</span> <strong className="text-orange-500">If Deposit Required:</strong> Escalate immediately to Approvals queue. Do not pay.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* TAB: TEACH */}
                {activeTab === 'teach' && (
                    <div className="space-y-6 h-full flex flex-col justify-center max-w-lg mx-auto">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">🎓</div>
                            <h2 className="text-xl font-bold">Teach Mode Playbook</h2>
                            <p className="text-sm opacity-70 mt-2">Define reusable guidelines for future operations.</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">What counts as total success?</label>
                                <input type="text" placeholder="e.g. Venue confirmed, contract signed." className={`w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">When should I immediately escalate?</label>
                                <input type="text" placeholder="e.g. Non-refundable deposit > $1,000." className={`w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'}`} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">What concessions can I offer?</label>
                                <input type="text" placeholder="e.g. Can adjust date by +/- 1 day." className={`w-full px-4 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-300'}`} />
                            </div>
                        </div>

                        <button className="w-full py-3 mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95">
                            Save Ops Playbook
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
