import { useState } from 'react';
import { useAppStore } from '../store/appState';
import { Settings, Key, Sliders, BookOpen, Check, ChevronRight } from 'lucide-react';

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'UFC', 'Soccer'];
const BOOKS = ['FanDuel', 'DraftKings', 'BetMGM', 'Caesars', 'PointsBet', 'Barstool'];
const SHARP_BOOKS = ['Pinnacle', 'Circa', 'BetOnline', 'Bookmaker.eu', 'Heritage Sports'];

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
    return (
        <div className="flex items-start gap-2.5 mb-4">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">{icon}</div>
            <div>
                <h3 className="font-semibold text-slate-100 text-[14px]">{title}</h3>
                <p className="text-[12px] text-slate-500 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

function ToggleChip({ label, active, onChange }: { label: string; active: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 flex items-center gap-1.5 ${active
                    ? 'border-blue-500/60 bg-blue-500/20 text-blue-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                }`}
        >
            {active && <Check size={12} />}
            {label}
        </button>
    );
}

export function ConfigPanel() {
    const { settings, updateSettings } = useAppStore();
    const [saved, setSaved] = useState(false);

    const toggleSport = (sport: string) => {
        const sports = settings.selectedSports.includes(sport)
            ? settings.selectedSports.filter((s) => s !== sport)
            : [...settings.selectedSports, sport];
        updateSettings({ selectedSports: sports });
    };

    const toggleSharp = (book: string) => {
        const books = settings.sharpBooks.includes(book)
            ? settings.sharpBooks.filter((b) => b !== book)
            : [...settings.sharpBooks, book];
        updateSettings({ sharpBooks: books });
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 max-w-2xl w-full mx-auto flex flex-col gap-4">

                {/* Gateway */}
                <div className="glass rounded-xl p-4">
                    <SectionHeader icon={<Key size={18} />} title="Gateway Connection" sub="Connect to your local DraftClaw engine" />
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
                                Gateway URL
                            </label>
                            <input
                                type="text"
                                value={settings.gatewayUrl}
                                onChange={(e) => updateSettings({ gatewayUrl: e.target.value })}
                                placeholder="ws://localhost:3000"
                                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
                                API Token
                            </label>
                            <input
                                type="password"
                                value={settings.token}
                                onChange={(e) => updateSettings({ token: e.target.value })}
                                placeholder="Paste your token here..."
                                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Sports Selection */}
                <div className="glass rounded-xl p-4">
                    <SectionHeader icon={<BookOpen size={18} />} title="Active Sports" sub="Toggle which leagues to scan for opportunities" />
                    <div className="flex flex-wrap gap-2">
                        {SPORTS.map((sport) => (
                            <ToggleChip
                                key={sport}
                                label={sport}
                                active={settings.selectedSports.includes(sport)}
                                onChange={() => toggleSport(sport)}
                            />
                        ))}
                    </div>
                </div>

                {/* Sharp Books */}
                <div className="glass rounded-xl p-4">
                    <SectionHeader icon={<Settings size={18} />} title="Sharp Books" sub="Books whose lines are treated as the 'true' market" />
                    <div className="flex flex-wrap gap-2 mb-4">
                        {SHARP_BOOKS.map((book) => (
                            <ToggleChip
                                key={book}
                                label={book}
                                active={settings.sharpBooks.includes(book)}
                                onChange={() => toggleSharp(book)}
                            />
                        ))}
                    </div>
                    <div className="mt-4">
                        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Retail Books (EV targets)</h4>
                        <div className="flex flex-wrap gap-2">
                            {BOOKS.map((book) => (
                                <span key={book} className="px-3 py-1.5 rounded-lg text-sm border border-white/10 bg-white/5 text-slate-500">
                                    {book}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* EV Threshold Slider */}
                <div className="glass rounded-xl p-4">
                    <SectionHeader
                        icon={<Sliders size={18} />}
                        title="EV Threshold"
                        sub="Only surface bets above this expected value"
                    />
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Minimum EV to display</span>
                            <span className="mono text-2xl font-bold text-blue-400">
                                +{(settings.evThreshold * 100).toFixed(1)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0.01}
                            max={0.15}
                            step={0.005}
                            value={settings.evThreshold}
                            onChange={(e) => updateSettings({ evThreshold: parseFloat(e.target.value) })}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>1% (All edges)</span>
                            <span>5% (Solid)</span>
                            <span>10% (Blasphemous)</span>
                            <span>15%</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-400 leading-relaxed">
                            <strong className="text-slate-300">What does {(settings.evThreshold * 100).toFixed(0)}% EV mean?</strong> If you placed 100 bets like this,
                            you'd expect to profit <strong className="text-blue-400">+${(settings.evThreshold * 100 * 10).toFixed(0)}</strong> per
                            $1,000 wagered on average over the long run, before variance.
                        </div>
                    </div>
                </div>

                {/* Bankroll */}
                <div className="glass rounded-xl p-4">
                    <SectionHeader icon={<SliderIcon />} title="Starting Bankroll" sub="Used to calculate ROI and Kelly bet sizing" />
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                        <input
                            type="number"
                            value={settings.initialBankroll}
                            onChange={(e) => updateSettings({ initialBankroll: parseFloat(e.target.value) || 1000 })}
                            className="w-full bg-slate-900/80 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${saved
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                >
                    {saved ? (
                        <><Check size={16} /> Settings Saved</>
                    ) : (
                        <><ChevronRight size={16} /> Save & Apply</>
                    )}
                </button>
            </div>
        </div>
    );
}

function SliderIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 7h4m0 0a2 2 0 104 0 2 2 0 00-4 0zm10 10h4m-4 0a2 2 0 104 0 2 2 0 00-4 0z" />
        </svg>
    );
}
