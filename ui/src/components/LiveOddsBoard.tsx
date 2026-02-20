import { useAppStore } from '../store/appState';
import type { BettingOpportunity } from '../store/appState';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, TrendingUp, Zap, Wifi, WifiOff, Loader, Activity } from 'lucide-react';

const SPORT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    NBA: { bg: 'bg-[var(--color-system-orange)]/15', text: 'text-[var(--color-system-orange)]', border: 'border-[var(--color-system-orange)]/20' },
    NFL: { bg: 'bg-[var(--color-system-green)]/15', text: 'text-[var(--color-system-green)]', border: 'border-[var(--color-system-green)]/20' },
    MLB: { bg: 'bg-[var(--color-system-blue)]/15', text: 'text-[var(--color-system-blue)]', border: 'border-[var(--color-system-blue)]/20' },
    NHL: { bg: 'bg-[var(--color-system-cyan)]/15', text: 'text-[var(--color-system-cyan)]', border: 'border-[var(--color-system-cyan)]/20' },
    UFC: { bg: 'bg-[var(--color-system-purple)]/15', text: 'text-[var(--color-system-purple)]', border: 'border-[var(--color-system-purple)]/20' },
    Soccer: { bg: 'bg-[var(--color-system-yellow)]/15', text: 'text-[var(--color-system-yellow)]', border: 'border-[var(--color-system-yellow)]/20' },
};

const DEFAULT_SPORT_COLOR = { bg: 'bg-[var(--color-system-gray)]/15', text: 'text-[var(--color-system-gray)]', border: 'border-[var(--color-system-gray)]/20' };

function evBadge(ev: number) {
    if (ev >= 0.10) return 'bg-[var(--color-system-orange)]/15 text-[var(--color-system-orange)] border-[var(--color-system-orange)]/20';
    if (ev >= 0.05) return 'bg-[var(--color-system-green)]/15 text-[var(--color-system-green)] border-[var(--color-system-green)]/20';
    return 'bg-[var(--color-system-blue)]/15 text-[var(--color-system-blue)] border-[var(--color-system-blue)]/20';
}

function formatOdds(n: number) {
    return n > 0 ? `+${n}` : `${n}`;
}

function ConnectionBadge() {
    const status = useAppStore((s) => s.connectionStatus);
    const map = {
        connected: { icon: <Wifi size={14} />, label: 'LIVE FEED ACTIVE', cls: 'text-[var(--color-system-green)] bg-[var(--color-system-green)]/10 border-[var(--color-system-green)]/20' },
        connecting: { icon: <Loader size={14} className="animate-spin" />, label: 'CONNECTING...', cls: 'text-[var(--color-system-orange)] bg-[var(--color-system-orange)]/10 border-[var(--color-system-orange)]/20' },
        disconnected: { icon: <WifiOff size={14} />, label: 'OFFLINE', cls: 'text-[var(--color-system-red)] bg-[var(--color-system-red)]/10 border-[var(--color-system-red)]/20' },
        error: { icon: <WifiOff size={14} />, label: 'CONNECTION ERROR', cls: 'text-[var(--color-system-red)] bg-[var(--color-system-red)]/10 border-[var(--color-system-red)]/20' },
    };
    const { icon, label, cls } = map[status] || map.disconnected;
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${cls}`}>
            {icon}
            <span className="text-[10px] font-bold tracking-widest leading-none pt-[1px]">{label}</span>
        </div>
    );
}

function OpportunityRow({ opp }: { opp: BettingOpportunity }) {
    const { updateOpportunityStatus } = useAppStore();
    const sportStyle = SPORT_COLORS[opp.sport] || DEFAULT_SPORT_COLOR;

    return (
        <motion.tr
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className="group relative border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-border)]/50"
        >
            {/* Sport Indicator */}
            <td className="py-2 px-3 align-middle">
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${sportStyle.bg} ${sportStyle.text} ${sportStyle.border}`}>
                    {opp.sport}
                </span>
            </td>

            {/* Game Info */}
            <td className="py-2 px-3 align-middle">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[14px] font-medium text-[var(--color-text-primary)] tracking-tight">
                        {opp.game}
                    </span>
                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                        {opp.team}
                    </span>
                </div>
            </td>

            {/* Bet Type */}
            <td className="py-2 px-3 align-middle">
                <span className="inline-flex items-center px-2.5 py-1 rounded text-[12px] text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                    {opp.betType}
                </span>
            </td>

            {/* Sharp Line */}
            <td className="py-2 px-3 align-middle">
                <div className="flex items-baseline gap-1">
                    <span className="text-[12px] text-[var(--color-text-tertiary)] font-medium">Sharp:</span>
                    <span className="mono text-[14px] font-semibold text-[var(--color-text-primary)]">{formatOdds(opp.sharpLine)}</span>
                </div>
            </td>

            {/* Retail Line */}
            <td className="py-2 px-3 align-middle">
                <div className="flex items-baseline gap-1">
                    <span className="text-[12px] text-[var(--color-text-tertiary)] font-medium">Retail:</span>
                    <span className="mono text-[14px] font-semibold text-[var(--color-text-secondary)]">{formatOdds(opp.retailLine)}</span>
                </div>
            </td>

            {/* EV Badge */}
            <td className="py-2 px-3 align-middle">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${evBadge(opp.ev)}`}>
                    <TrendingUp size={12} className={opp.ev >= 0.1 ? 'animate-pulse' : ''} />
                    <span className="mono text-[13px] font-bold">
                        +{(opp.ev * 100).toFixed(1)}%
                    </span>
                </div>
            </td>

            {/* Bookmaker */}
            <td className="py-2 px-3 align-middle">
                <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                    {opp.bookmaker}
                </span>
            </td>

            {/* Actions */}
            <td className="py-2 px-3 align-middle text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {opp.deepLink && (
                        <a
                            href={opp.deepLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => updateOpportunityStatus(opp.id, 'placed')}
                            className="flex items-center justify-center gap-1.5 text-[12px] font-semibold px-4 py-1.5 bg-[var(--color-system-blue)] text-white rounded-full transition-opacity ios-active"
                        >
                            Open
                        </a>
                    )}
                    <button
                        onClick={() => updateOpportunityStatus(opp.id, 'skipped')}
                        className="text-[12px] font-medium px-4 py-1.5 text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:bg-[var(--color-border-bright)] rounded-full transition-colors ios-active"
                    >
                        Hide
                    </button>
                </div>
            </td>
        </motion.tr>
    );
}

export function LiveOddsBoard() {
    const opportunities = useAppStore((s) => s.opportunities);
    const live = opportunities.filter((o) => o.status === 'live');
    const evThreshold = useAppStore((s) => s.settings.evThreshold);

    const filtered = live
        .filter((o) => o.ev >= evThreshold)
        .sort((a, b) => b.ev - a.ev);

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-base)]">
            {/* Header Section */}
            <div className="flex-none px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-system-green)]/10 text-[var(--color-system-green)]">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)] tracking-tight flex items-center gap-2">
                                War Room Scanner
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)] ml-1">
                                    {filtered.length} Active
                                </span>
                            </h2>
                            <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5 tracking-tight">
                                Real-time Arbitrage & EV Opportunities
                            </p>
                        </div>
                    </div>
                    <ConnectionBadge />
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5 text-[var(--color-text-secondary)]">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                            <Zap size={32} className="opacity-40" />
                        </div>
                        <div className="text-center">
                            <p className="text-[15px] font-medium text-[var(--color-text-primary)] mb-1">No active opportunities</p>
                            <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-xs mx-auto text-balance">
                                Scanning for opportunities above <span className="text-[var(--color-text-secondary)] font-semibold">{(evThreshold * 100).toFixed(0)}% EV</span>. The board will update automatically.
                            </p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 mac-material-elevated z-20 shadow-sm border-b border-[var(--color-border)]">
                            <tr>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-20">Sport</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-56">Matchup</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-28">Market</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-28">Sharp</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-28">Retail</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-36">Edge (EV)</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide w-28">Book</th>
                                <th className="py-2 px-3 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide text-right w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-bg-base)]">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((opp) => (
                                    <OpportunityRow key={opp.id} opp={opp} />
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
