import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appState';
import type { AppState } from '../store/appState';
import {
    Crosshair, Flame, TrendingUp, Settings, Terminal,
    ChevronLeft, ChevronRight, Wifi, WifiOff, Loader,
} from 'lucide-react';

type Tab = AppState['activeTab'];

export const NAV_ITEMS: { id: Tab; icon: React.ReactNode; label: string; badge?: string }[] = [
    { id: 'war-room', icon: <Crosshair size={18} />, label: 'War Room' },
    { id: 'alerts', icon: <Flame size={18} />, label: 'Alerts', badge: 'LIVE' },
    { id: 'bankroll', icon: <TrendingUp size={18} />, label: 'Bankroll' },
    { id: 'config', icon: <Settings size={18} />, label: 'Config' },
    { id: 'logs', icon: <Terminal size={18} />, label: 'Logs' },
];

function ConnectionStatus() {
    const status = useAppStore((s) => s.connectionStatus);
    if (status === 'connected') return <Wifi size={14} className="text-[var(--color-system-green)]" />;
    if (status === 'connecting') return <Loader size={14} className="text-[var(--color-system-orange)] animate-spin" />;
    return <WifiOff size={14} className="text-[var(--color-system-red)]" />;
}

export function Sidebar() {
    const { activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
    const collapsed = sidebarCollapsed;

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 220 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col shrink-0 h-full border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-hidden z-30"
        >
            {/* ── Logo / Brand ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3 h-14 px-3.5 border-b border-[var(--color-border)] overflow-hidden">
                {/* Real DraftClaw icon — always visible */}
                <img
                    src="/draftclaw-icon.png"
                    alt="DraftClaw icon"
                    className="shrink-0 w-8 h-8 rounded-[8px] object-contain shadow-sm"
                />
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="overflow-hidden min-w-0 flex flex-col justify-center"
                        >
                            {/* Real DraftClaw wordmark logo */}
                            <img
                                src="/draftclaw-logo.png"
                                alt="DraftClaw"
                                className="h-4 w-auto object-contain object-left mb-0.5"
                            />
                            <div className="text-[11px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap leading-none tracking-tight">Live EV Scanner</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Nav ───────────────────────────────────────────────────── */}
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto custom-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const active = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            title={collapsed ? item.label : undefined}
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-[14px] font-medium transition-colors text-left group ios-active ${active
                                ? 'bg-[var(--color-system-blue)] text-white shadow-sm'
                                : 'text-[var(--color-text-primary)] hover:bg-[var(--color-border-bright)]'
                                }`}
                        >
                            <span className="shrink-0 opacity-90">{item.icon}</span>
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        className="whitespace-nowrap overflow-hidden tracking-tight"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {!collapsed && item.badge && (
                                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${active ? 'bg-white/20 text-white' : 'bg-[var(--color-system-red)]/15 text-[var(--color-system-red)]'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ── Bottom: connection + collapse ─────────────────────────── */}
            <div className="px-3 pb-4 flex flex-col gap-1">
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] border border-[var(--color-border)] shadow-sm">
                    <ConnectionStatus />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Primary Node
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
                <button
                    onClick={() => setSidebarCollapsed(!collapsed)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-bright)] transition-colors ios-active mt-1"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-[13px] font-medium whitespace-nowrap tracking-tight"
                            >
                                Hide Sidebar
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    );
}
