import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appState';
import { Terminal } from 'lucide-react';

export function LogViewer() {
    const logLines = useAppStore((s) => s.logLines);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logLines.length]);

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3">
                <Terminal size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-200">System Logs</h2>
                <span className="mono text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">
                    {logLines.length} lines
                </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-relaxed">
                {logLines.map((line, i) => (
                    <div key={i} className={`py-0.5 ${line.includes('EV alert') ? 'text-emerald-400' : line.includes('disconnected') || line.includes('error') ? 'text-red-400' : line.includes('connect') ? 'text-blue-400' : 'text-slate-500'}`}>
                        {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
