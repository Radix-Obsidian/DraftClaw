import { useAppStore } from '../store/appState';
import { NAV_ITEMS } from './Sidebar';

export function BottomNav() {
    const { activeTab, setActiveTab, alerts } = useAppStore();
    const liveAlertCount = alerts.length;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch bg-[var(--color-bg-surface)] border-t border-[var(--color-border)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {NAV_ITEMS.map((item) => {
                const active = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-colors ios-active relative ${active
                            ? 'text-[var(--color-system-blue)]'
                            : 'text-[var(--color-text-secondary)]'
                            }`}
                    >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        {item.id === 'alerts' && liveAlertCount > 0 && (
                            <span className="absolute top-1.5 right-[calc(50%-18px)] w-2 h-2 rounded-full bg-[var(--color-system-red)]" />
                        )}
                    </button>
                );
            })}
        </nav>
    );
}
