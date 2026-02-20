import { create } from 'zustand';
import type { GatewayBrowserClient, GatewayEventFrame, GatewayHelloOk } from '../lib/gateway';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BettingOpportunity = {
    id: string;
    game: string;
    sport: 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'UFC' | 'Soccer';
    betType: 'Spread' | 'ML' | 'Total' | 'Prop';
    team: string;
    sharpLine: number;
    retailLine: number;
    ev: number; // as decimal e.g. 0.05 = 5%
    bookmaker: string;
    deepLink?: string;
    timestamp: number;
    status: 'live' | 'expired' | 'placed' | 'skipped';
};

export type BankrollEntry = {
    date: string;
    balance: number;
    profit: number;
};

export type AlertEntry = {
    id: string;
    message: string;
    ev: number;
    game: string;
    timestamp: number;
    type: 'normal' | 'high' | 'blasphemous';
};

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type Settings = {
    gatewayUrl: string;
    token: string;
    initialBankroll: number;
    evThreshold: number;
    selectedSports: string[];
    sharpBooks: string[];
};

// ─── State Interface ──────────────────────────────────────────────────────────

export interface AppState {
    // Connection
    connectionStatus: ConnectionStatus;
    lastError: string | null;
    hello: GatewayHelloOk | null;
    client: GatewayBrowserClient | null;

    // Betting Data
    opportunities: BettingOpportunity[];
    alerts: AlertEntry[];
    bankrollHistory: BankrollEntry[];

    // Settings
    settings: Settings;

    // UI
    activeTab: 'war-room' | 'alerts' | 'bankroll' | 'config' | 'logs';
    sidebarCollapsed: boolean;

    // Log stream
    logLines: string[];

    // Actions
    setConnectionStatus: (s: ConnectionStatus) => void;
    setLastError: (e: string | null) => void;
    setHello: (h: GatewayHelloOk | null) => void;
    setClient: (c: GatewayBrowserClient | null) => void;
    addOpportunity: (o: BettingOpportunity) => void;
    updateOpportunityStatus: (id: string, status: BettingOpportunity['status']) => void;
    addAlert: (a: AlertEntry) => void;
    addBankrollEntry: (e: BankrollEntry) => void;
    updateSettings: (s: Partial<Settings>) => void;
    setActiveTab: (t: AppState['activeTab']) => void;
    setSidebarCollapsed: (v: boolean) => void;
    addLogLine: (line: string) => void;
    handleGatewayEvent: (evt: GatewayEventFrame) => void;
}

// ─── Mock seed data ───────────────────────────────────────────────────────────

const now = Date.now();

const MOCK_OPPORTUNITIES: BettingOpportunity[] = [
    {
        id: '1', game: 'LAL vs GSW', sport: 'NBA', betType: 'Spread',
        team: 'GSW -3.5', sharpLine: -110, retailLine: -120,
        ev: 0.087, bookmaker: 'FanDuel', timestamp: now - 60000, status: 'live',
    },
    {
        id: '2', game: 'KC vs PHI', sport: 'NFL', betType: 'ML',
        team: 'PHI +175', sharpLine: 170, retailLine: 155,
        ev: 0.051, bookmaker: 'DraftKings', timestamp: now - 90000, status: 'live',
    },
    {
        id: '3', game: 'NYK vs BOS', sport: 'NBA', betType: 'Total',
        team: 'Over 221.5', sharpLine: -108, retailLine: -118,
        ev: 0.127, bookmaker: 'BetMGM', deepLink: 'https://betmgm.com',
        timestamp: now - 30000, status: 'live',
    },
    {
        id: '4', game: 'MIA vs DEN', sport: 'NBA', betType: 'Spread',
        team: 'MIA +6.5', sharpLine: -112, retailLine: -125,
        ev: 0.031, bookmaker: 'Caesars', timestamp: now - 180000, status: 'live',
    },
    {
        id: '5', game: 'SF vs DAL', sport: 'NFL', betType: 'Prop',
        team: 'CMC Rush Yards O 98.5', sharpLine: -115, retailLine: -130,
        ev: 0.115, bookmaker: 'FanDuel', timestamp: now - 15000, status: 'live',
    },
];

const MOCK_ALERTS: AlertEntry[] = [
    {
        id: 'a1', message: "BLASPHEMOUS INEFFICIENCY! The market is SLEEPING on GSW -3.5 — this is FREE MONEY at 8.7% EV. The sharp action does not LIE!",
        ev: 0.087, game: 'LAL vs GSW', timestamp: now - 60000, type: 'blasphemous',
    },
    {
        id: 'a2', message: "High value line movement detected on NYK vs BOS Total. Sharp handle: 71% on the Over. Book hasn't adjusted. This is a GIFT.",
        ev: 0.127, game: 'NYK vs BOS', timestamp: now - 30000, type: 'high',
    },
    {
        id: 'a3', message: "Moderate edge on PHI +175. Positive EV confirms value. Market may close soon.",
        ev: 0.051, game: 'KC vs PHI', timestamp: now - 90000, type: 'normal',
    },
];

const generateBankroll = () => {
    const entries: BankrollEntry[] = [];
    let balance = 1000;
    for (let i = 30; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const change = (Math.random() - 0.38) * 60;
        balance += change;
        entries.push({
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            balance: Math.round(balance * 100) / 100,
            profit: Math.round((balance - 1000) * 100) / 100,
        });
    }
    return entries;
};

// ─── Default Settings ─────────────────────────────────────────────────────────

const loadSettings = (): Settings => {
    try {
        const raw = localStorage.getItem('draftclaw_settings');
        if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return defaultSettings;
};

const defaultSettings: Settings = {
    gatewayUrl: 'ws://localhost:3000',
    token: '',
    initialBankroll: 1000,
    evThreshold: 0.03,
    selectedSports: ['NBA', 'NFL'],
    sharpBooks: ['Pinnacle', 'Circa'],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
    connectionStatus: 'disconnected',
    lastError: null,
    hello: null,
    client: null,

    opportunities: MOCK_OPPORTUNITIES,
    alerts: MOCK_ALERTS,
    bankrollHistory: generateBankroll(),

    settings: loadSettings(),
    activeTab: 'war-room',
    sidebarCollapsed: false,
    logLines: [
        '[22:30:01] Gateway connected',
        '[22:30:02] Scanning NFL: 128 markets indexed',
        '[22:30:15] EV alert: NYK vs BOS O221.5 → +12.7%',
        '[22:30:45] EV alert: LAL vs GSW -3.5 → +8.7%',
        '[22:31:02] Line update: PHI +175 (was +165)',
    ],

    setConnectionStatus: (s) => set({ connectionStatus: s }),
    setLastError: (e) => set({ lastError: e }),
    setHello: (h) => set({ hello: h }),
    setClient: (c) => set({ client: c }),

    addOpportunity: (o) =>
        set((state) => ({
            opportunities: [o, ...state.opportunities.filter((x) => x.id !== o.id)].slice(0, 50),
        })),

    updateOpportunityStatus: (id, status) =>
        set((state) => ({
            opportunities: state.opportunities.map((o) => o.id === id ? { ...o, status } : o),
        })),

    addAlert: (a) =>
        set((state) => ({ alerts: [a, ...state.alerts].slice(0, 100) })),

    addBankrollEntry: (e) =>
        set((state) => ({ bankrollHistory: [...state.bankrollHistory, e].slice(-90) })),

    updateSettings: (s) => {
        const next = { ...get().settings, ...s };
        try { localStorage.setItem('draftclaw_settings', JSON.stringify(next)); } catch { /* ignore */ }
        set({ settings: next });
    },

    setActiveTab: (t) => set({ activeTab: t }),
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

    addLogLine: (line) =>
        set((state) => ({ logLines: [...state.logLines, line].slice(-500) })),

    handleGatewayEvent: (evt) => {
        const { addLogLine, addAlert, addOpportunity } = get();
        addLogLine(`[${new Date().toLocaleTimeString()}] ${evt.event}: ${JSON.stringify(evt.payload ?? {}).slice(0, 80)}`);

        if (evt.event === 'ev.alert') {
            const p = evt.payload as AlertEntry | undefined;
            if (p) addAlert({ ...p, timestamp: Date.now() });
        }
        if (evt.event === 'ev.opportunity') {
            const p = evt.payload as BettingOpportunity | undefined;
            if (p) addOpportunity({ ...p, timestamp: Date.now() });
        }
    },
}));
