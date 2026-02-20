import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appState';

export function LiveTicker() {
    const opportunities = useAppStore((s) => s.opportunities);
    const [paused, setPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const live = opportunities.filter((o) => o.status === 'live' && o.ev >= 0.03);

    if (live.length === 0) return null;

    const items = [...live, ...live]; // Duplicate for seamless looping

    return (
        <div
            className="relative flex items-center border-b border-[var(--color-border)] bg-[var(--color-bg-base)] h-10 overflow-hidden select-none cursor-pointer group"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Click to resume ticker' : 'Click to pause ticker'}
        >
            {/* Label */}
            <div className="shrink-0 flex items-center gap-2 px-5 h-full bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] z-10 relative shadow-sm">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors"></div>
                <div className="relative flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-system-blue)] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-system-blue)] shadow-[0_0_8px_rgba(10,132,255,0.6)]"></span>
                    </span>
                    <span className="text-[11px] font-semibold text-[var(--color-system-blue)] tracking-wide whitespace-nowrap">LIVE FEED</span>
                </div>
            </div>

            {/* Scrolling content */}
            <div ref={containerRef} className="flex-1 overflow-hidden h-full flex items-center">
                <div
                    className="flex items-center gap-8 whitespace-nowrap"
                    style={{
                        animation: paused ? 'none' : `ticker-scroll ${live.length * 8}s linear infinite`,
                    }}
                >
                    {items.map((opp, i) => (
                        <span key={`${opp.id}-${i}`} className="inline-flex items-center gap-[6px] text-[13px] tracking-tight">
                            <span className="text-[var(--color-text-secondary)]">{opp.game}</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{opp.team}</span>
                            <span className={`font-semibold mono ${opp.ev >= 0.10 ? 'text-[var(--color-system-orange)]' : opp.ev >= 0.05 ? 'text-[var(--color-system-green)]' : 'text-[var(--color-system-blue)]'}`}>
                                +{(opp.ev * 100).toFixed(1)}%
                            </span>
                            <span className="text-[var(--color-text-tertiary)]">@ {opp.bookmaker}</span>
                            <span className="text-[var(--color-border-bright)] mx-3">•</span>
                        </span>
                    ))}
                </div>
            </div>

            {paused && (
                <div className="absolute right-4 text-[12px] font-medium text-[var(--color-system-orange)] bg-[var(--color-bg-elevated)] px-2 py-1 rounded shadow-sm border border-[var(--color-border)]">
                    Paused
                </div>
            )}
        </div>
    );
}
