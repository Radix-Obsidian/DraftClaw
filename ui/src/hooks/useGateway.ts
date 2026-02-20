import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appState';
import { GatewayBrowserClient } from '../lib/gateway';

export function useGateway() {
    const { settings, setConnectionStatus, setHello, setClient, setLastError, addLogLine, handleGatewayEvent } = useAppStore();
    const clientRef = useRef<GatewayBrowserClient | null>(null);

    useEffect(() => {
        if (!settings.gatewayUrl) return;

        setConnectionStatus('connecting');
        addLogLine(`[${new Date().toLocaleTimeString()}] Connecting to ${settings.gatewayUrl}...`);

        const client = new GatewayBrowserClient({
            url: settings.gatewayUrl,
            token: settings.token || undefined,
            onHello: (hello) => {
                setConnectionStatus('connected');
                setHello(hello);
                addLogLine(`[${new Date().toLocaleTimeString()}] Gateway connected (protocol v${hello.protocol})`);
            },
            onClose: ({ code, reason }) => {
                setConnectionStatus('disconnected');
                const msg = `disconnected (${code}): ${reason || 'no reason'}`;
                setLastError(msg);
                addLogLine(`[${new Date().toLocaleTimeString()}] ${msg}`);
            },
            onEvent: (evt) => handleGatewayEvent(evt),
        });

        client.start();
        clientRef.current = client;
        setClient(client);

        return () => {
            client.stop();
            clientRef.current = null;
            setClient(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.gatewayUrl, settings.token]);

    return clientRef;
}
