// Ported from ui-legacy/src/ui/gateway.ts
// Handles WebSocket connection to the DraftClaw Gateway

export type GatewayEventFrame = {
    type: 'event';
    event: string;
    payload?: unknown;
    seq?: number;
};

export type GatewayResponseFrame = {
    type: 'res';
    id: string;
    ok: boolean;
    payload?: unknown;
    error?: { code: string; message: string };
};

export type GatewayHelloOk = {
    type: 'hello-ok';
    protocol: number;
    features?: { methods?: string[]; events?: string[] };
    snapshot?: unknown;
};

type Pending = {
    resolve: (value: unknown) => void;
    reject: (err: unknown) => void;
};

export type GatewayClientOptions = {
    url: string;
    token?: string;
    password?: string;
    onHello?: (hello: GatewayHelloOk) => void;
    onEvent?: (evt: GatewayEventFrame) => void;
    onClose?: (info: { code: number; reason: string }) => void;
};

function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class GatewayBrowserClient {
    private ws: WebSocket | null = null;
    private pending = new Map<string, Pending>();
    private closed = false;
    private connectSent = false;
    private backoffMs = 800;

    constructor(private opts: GatewayClientOptions) { }

    start() {
        this.closed = false;
        this.connect();
    }

    stop() {
        this.closed = true;
        this.ws?.close();
        this.ws = null;
        this.flushPending(new Error('gateway client stopped'));
    }

    get isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private connect() {
        if (this.closed) return;
        try {
            this.ws = new WebSocket(this.opts.url);
        } catch {
            this.scheduleReconnect();
            return;
        }
        this.ws.addEventListener('open', () => this.sendConnect());
        this.ws.addEventListener('message', (ev) => this.handleMessage(String(ev.data ?? '')));
        this.ws.addEventListener('close', (ev) => {
            const reason = String(ev.reason ?? '');
            this.ws = null;
            this.connectSent = false;
            this.flushPending(new Error(`gateway closed (${ev.code}): ${reason}`));
            this.opts.onClose?.({ code: ev.code, reason });
            this.scheduleReconnect();
        });
        this.ws.addEventListener('error', () => {
            // close handler will fire
        });
    }

    private scheduleReconnect() {
        if (this.closed) return;
        const delay = this.backoffMs;
        this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000);
        window.setTimeout(() => this.connect(), delay);
    }

    private flushPending(err: Error) {
        for (const [, p] of this.pending) p.reject(err);
        this.pending.clear();
    }

    private async sendConnect() {
        if (this.connectSent) return;
        this.connectSent = true;

        const params = {
            minProtocol: 3,
            maxProtocol: 3,
            client: { id: 'draftclaw-war-room', version: '2.0.0', mode: 'webchat' },
            role: 'operator',
            scopes: ['operator.admin'],
            auth: this.opts.token ? { token: this.opts.token } : undefined,
        };

        try {
            const hello = await this.request<GatewayHelloOk>('connect', params);
            this.backoffMs = 800;
            this.opts.onHello?.(hello);
        } catch {
            this.ws?.close(4008, 'connect failed');
        }
    }

    private handleMessage(raw: string) {
        let parsed: unknown;
        try { parsed = JSON.parse(raw); } catch { return; }

        const frame = parsed as { type?: unknown };

        if (frame.type === 'event') {
            const evt = parsed as GatewayEventFrame;
            try { this.opts.onEvent?.(evt); } catch (err) { console.error('[gateway] event error:', err); }
            return;
        }

        if (frame.type === 'res') {
            const res = parsed as GatewayResponseFrame;
            const pending = this.pending.get(res.id);
            if (!pending) return;
            this.pending.delete(res.id);
            if (res.ok) pending.resolve(res.payload);
            else pending.reject(new Error(res.error?.message ?? 'request failed'));
        }
    }

    request<T = unknown>(method: string, params?: unknown): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return Promise.reject(new Error('gateway not connected'));
        }
        const id = generateId();
        const p = new Promise<T>((resolve, reject) => {
            this.pending.set(id, { resolve: (v) => resolve(v as T), reject });
        });
        this.ws.send(JSON.stringify({ type: 'req', id, method, params }));
        return p;
    }
}
