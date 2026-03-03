import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.DRAFTCLAW_JWT_SECRET = 'test-secret-at-least-32-characters-long-for-tests';
});

describe('JWT Auth', () => {
  it('creates and verifies a valid JWT', async () => {
    const { createAccessToken, verifyAccessToken } = await import('./jwt.js');
    const user = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      subscriptionTier: 'free' as const,
      phone: null, passwordHash: null, whatsappJid: null, whatsappLinked: false,
      stripeCustomerId: null, emailVerified: true, emailVerificationToken: null,
      passwordResetToken: null, passwordResetExpires: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const token = createAccessToken(user);
    expect(token.split('.')).toHaveLength(3);
    const payload = verifyAccessToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe(user.id);
    expect(payload!.email).toBe(user.email);
  });

  it('rejects tampered token', async () => {
    const { createAccessToken, verifyAccessToken } = await import('./jwt.js');
    const user = { id: 'abc', email: 'h@x.com', subscriptionTier: 'goat' as const, phone: null, passwordHash: null, whatsappJid: null, whatsappLinked: false, stripeCustomerId: null, emailVerified: true, emailVerificationToken: null, passwordResetToken: null, passwordResetExpires: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const token = createAccessToken(user);
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(verifyAccessToken(tampered)).toBeNull();
  });
});
