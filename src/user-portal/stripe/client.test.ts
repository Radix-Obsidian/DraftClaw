import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

describe('Stripe Webhook Verification', () => {
  const SECRET = 'whsec_test_secret';

  function sign(payload: string, ts: number) {
    const sig = createHmac('sha256', SECRET).update(`${ts}.${payload}`).digest('hex');
    return `t=${ts},v1=${sig}`;
  }

  it('verifies a valid signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const { stripeClient } = await import('./client.js');
    const payload = '{"type":"checkout.session.completed"}';
    const ts = Math.floor(Date.now() / 1000);
    expect(stripeClient.verifyWebhookSignature(payload, sign(payload, ts))).toBe(true);
  });

  it('rejects invalid signature', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const { stripeClient } = await import('./client.js');
    const payload = '{"type":"test"}';
    const ts = Math.floor(Date.now() / 1000);
    expect(stripeClient.verifyWebhookSignature(payload, `t=${ts},v1=bad`)).toBe(false);
  });

  it('rejects replay (>5min old)', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    const { stripeClient } = await import('./client.js');
    const payload = '{"type":"test"}';
    const ts = Math.floor(Date.now() / 1000) - 360;
    expect(stripeClient.verifyWebhookSignature(payload, sign(payload, ts))).toBe(false);
  });
});
