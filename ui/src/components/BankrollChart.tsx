import { useAppStore } from '../store/appState';
import type { BankrollEntry } from '../store/appState';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';

function StatCard({ label, value, sub, positive }: {
    label: string;
    value: string;
    sub?: string;
    positive?: boolean;
}) {
    return (
        <div className="glass rounded-xl p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-2xl font-bold mono ${positive === undefined ? 'text-slate-100' : positive ? 'text-emerald-400' : 'text-red-400'}`}>
                {value}
            </div>
            {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
    );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: BankrollEntry }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    const entry = payload[0]?.payload;
    if (!entry) return null;
    const { balance, profit } = entry;
    const pos = profit >= 0;
    return (
        <div className="glass rounded-lg px-3 py-2 text-sm shadow-xl">
            <p className="text-slate-400 text-xs mb-1">{label}</p>
            <p className="text-slate-100 font-semibold">Balance: <span className="mono">${balance.toFixed(2)}</span></p>
            <p className={pos ? 'text-emerald-400' : 'text-red-400'}>
                P&L: <span className="mono">{pos ? '+' : ''}{profit.toFixed(2)}</span>
            </p>
        </div>
    );
}

export function BankrollChart() {
    const history = useAppStore((s) => s.bankrollHistory);
    const settings = useAppStore((s) => s.settings);

    if (history.length === 0) return null;

    const latest = history[history.length - 1];
    const totalProfit = latest.balance - settings.initialBankroll;
    const roi = (totalProfit / settings.initialBankroll) * 100;
    const isPositive = totalProfit >= 0;

    const peak = Math.max(...history.map((h) => h.balance));
    const drawdown = peak > 0 ? ((peak - latest.balance) / peak) * 100 : 0;
    const winDays = history.filter((h, i) => i > 0 && h.balance > history[i - 1].balance).length;

    const gradientId = isPositive ? 'greenGrad' : 'redGrad';
    const strokeColor = isPositive ? '#10b981' : '#ef4444';

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                    label="Current Balance"
                    value={`$${latest.balance.toFixed(2)}`}
                    positive={isPositive}
                />
                <StatCard
                    label="Total P&L"
                    value={`${isPositive ? '+' : ''}$${totalProfit.toFixed(2)}`}
                    sub={`${roi.toFixed(1)}% ROI`}
                    positive={isPositive}
                />
                <StatCard
                    label="Max Drawdown"
                    value={`${drawdown.toFixed(1)}%`}
                    positive={drawdown < 5}
                />
                <StatCard
                    label="Win Days"
                    value={`${winDays}`}
                    sub={`of ${history.length} days tracked`}
                />
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0 glass rounded-xl p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                    {isPositive ? (
                        <TrendingUp size={16} className="text-emerald-400" />
                    ) : (
                        <TrendingDown size={16} className="text-red-400" />
                    )}
                    <span className="text-sm font-semibold text-slate-200">Bankroll Growth (30 Days)</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                        <Target size={12} /> Starting: <span className="mono text-slate-300">${settings.initialBankroll}</span>
                    </span>
                </div>
                <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#475569', fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            interval={6}
                        />
                        <YAxis
                            tick={{ fill: '#475569', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v}`}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={settings.initialBankroll}
                            stroke="rgba(255,255,255,0.15)"
                            strokeDasharray="6 3"
                            label={{ value: 'Start', fill: '#475569', fontSize: 10, position: 'insideTopLeft' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, fill: strokeColor, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom note */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <DollarSign size={12} />
                <span>Based on Kelly Criterion flat-betting at 2% bankroll per bet. Past performance does not guarantee future results.</span>
            </div>
        </div>
    );
}
