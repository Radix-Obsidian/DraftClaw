import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appState';
import type { AlertEntry } from '../store/appState';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, TrendingUp, AlertTriangle } from 'lucide-react';

function alertIcon(type: AlertEntry['type']) {
    if (type === 'blasphemous') return <Flame size={16} className="text-amber-400" />;
    if (type === 'high') return <TrendingUp size={16} className="text-emerald-400" />;
    return <AlertTriangle size={16} className="text-blue-400" />;
}

function alertBorder(type: AlertEntry['type']) {
    if (type === 'blasphemous') return 'border-amber-500/30 bg-amber-500/5 glow-red';
    if (type === 'high') return 'border-emerald-500/30 bg-emerald-500/5 glow-green';
    return 'border-blue-500/20 bg-blue-500/5';
}

function evLabel(ev: number) {
    if (ev >= 0.10) return '🔥 BLASPHEMOUS';
    if (ev >= 0.05) return '💰 HIGH VALUE';
    return '📊 POSITIVE EV';
}

function timeAgo(ts: number) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    return `${m}m ago`;
}

function AlertCard({ alert }: { alert: AlertEntry }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`rounded-lg border p-3 ${alertBorder(alert.type)}`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{alertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                            {evLabel(alert.ev)}
                        </span>
                        <span className="mono text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                            +{(alert.ev * 100).toFixed(1)}% EV
                        </span>
                        <span className="text-xs text-slate-600">{alert.game}</span>
                        <span className="ml-auto text-xs text-slate-600 shrink-0">{timeAgo(alert.timestamp)}</span>
                    </div>
                    {/* Message */}
                    <p className={`text-sm leading-relaxed ${alert.type === 'blasphemous' ? 'text-amber-100/90' : 'text-slate-300'}`}>
                        {alert.message}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

export function AlertFeed() {
    const alerts = useAppStore((s) => s.alerts);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [alerts.length]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3">
                <Flame size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-200">The Anchor's Alerts</h2>
                <span className="mono text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                    {alerts.length}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    <span className="text-xs text-slate-500">Live feed</span>
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                        <Flame size={32} className="opacity-20" />
                        <p className="text-sm">No alerts yet. The Anchor is watching...</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {[...alerts].reverse().map((a) => (
                            <AlertCard key={a.id} alert={a} />
                        ))}
                    </AnimatePresence>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
