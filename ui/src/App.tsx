import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store/appState';
import { Sidebar } from './components/Sidebar';
import { LiveTicker } from './components/LiveTicker';
import { LiveOddsBoard } from './components/LiveOddsBoard';
import { AlertFeed } from './components/AlertFeed';
import { BankrollChart } from './components/BankrollChart';
import { ConfigPanel } from './components/ConfigPanel';
import { LogViewer } from './components/LogViewer';
import { useGateway } from './hooks/useGateway';
import { Crosshair, TrendingUp, Flame, Settings, Terminal } from 'lucide-react';

const PAGE_TITLES: Record<string, { title: string; icon: React.ReactNode }> = {
  'war-room': { title: 'War Room', icon: <Crosshair size={16} className="text-blue-400" /> },
  'alerts': { title: "The Anchor's Alerts", icon: <Flame size={16} className="text-amber-400" /> },
  'bankroll': { title: 'Bankroll & ROI', icon: <TrendingUp size={16} className="text-emerald-400" /> },
  'config': { title: 'Configuration', icon: <Settings size={16} className="text-slate-400" /> },
  'logs': { title: 'System Logs', icon: <Terminal size={16} className="text-emerald-400" /> },
};

function PageContent({ tab }: { tab: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="h-full"
      >
        {tab === 'war-room' && <WarRoomPage />}
        {tab === 'alerts' && <AlertFeed />}
        {tab === 'bankroll' && (
          <div className="h-full p-3">
            <BankrollChart />
          </div>
        )}
        {tab === 'config' && <ConfigPanel />}
        {tab === 'logs' && <LogViewer />}
      </motion.div>
    </AnimatePresence>
  );
}

function WarRoomPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Main odds board — takes most space */}
      <div className="flex-1 overflow-hidden">
        <LiveOddsBoard />
      </div>
      {/* Bottom strip: latest alert */}
      <LatestAlertStrip />
    </div>
  );
}

function LatestAlertStrip() {
  const alerts = useAppStore((s) => s.alerts);
  const latest = alerts[0];
  if (!latest) return null;

  return (
    <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] px-5 py-2.5 flex items-center gap-3 shadow-sm z-20">
      <div className="flex items-center justify-center w-6 h-6 rounded bg-[var(--color-system-orange)]/10 text-[var(--color-system-orange)] shrink-0">
        <Flame size={14} className="animate-pulse-slow" />
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">RECENT MATCH:</span>
        <span className="text-[13px] text-[var(--color-text-primary)] line-clamp-1">{latest.message}</span>
      </div>
      <div className="shrink-0 pl-4 border-l border-[var(--color-border)]">
        <span className="mono text-[13px] font-semibold text-[var(--color-system-green)]">
          +{(latest.ev * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  useGateway();

  const { title, icon } = PAGE_TITLES[activeTab] ?? PAGE_TITLES['war-room'];

  return (
    <div className="flex h-screen w-screen overflow-hidden text-sm" style={{ background: 'var(--color-bg-base)' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Live EV ticker */}
        <LiveTicker />

        {/* Top bar - hide on pages that render their own internal header */}
        {activeTab !== 'war-room' && activeTab !== 'alerts' && activeTab !== 'logs' && (
          <header className="flex items-center gap-2 px-4 h-10 border-b border-[var(--color-border)] bg-[var(--color-bg-base)] shrink-0 z-20">
            {icon}
            <h1 className="text-[15px] font-medium tracking-tight text-[var(--color-text-primary)]">{title}</h1>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-hidden relative z-10 bg-[var(--color-bg-base)]">
          <PageContent tab={activeTab} />
        </main>
      </div>
    </div>
  );
}
