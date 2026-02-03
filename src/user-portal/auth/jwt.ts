import { createHmac, randomBytes } from "node:crypto";
import type { User, Session } from "../db/schema.js";

export interface JWTPayload {
  sub: string; // user id
  email: string;
  tier: string;
  iat: number;
  exp: number;
  jti: string; // unique token id
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

const JWT_SECRET = process.env.DRAFTCLAW_JWT_SECRET || process.env.JWT_SECRET || "draftclaw-dev-secret-change-in-production";
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(data: string): string {
  const padded = data + "=".repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
}

function createSignature(header: string, payload: string, secret: string): string {
  const data = `${header}.${payload}`;
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  return base64UrlEncode(hmac.digest("base64"));
}

export function generateTokenId(): string {
  return randomBytes(16).toString("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function createAccessToken(user: User): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    tier: user.subscriptionTier,
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY,
    jti: generateTokenId(),
  };
  
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = createSignature(header, encodedPayload, JWT_SECRET);
  
  return `${header}.${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    const [header, payload, signature] = parts;
    const expectedSignature = createSignature(header, payload, JWT_SECRET);
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decoded = JSON.parse(base64UrlDecode(payload)) as JWTPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

export function createTokenPair(user: User): TokenPair {
  const accessToken = createAccessToken(user);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
  
  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  
  return parts[1];
}

export function getAccessTokenExpiry(): number {
  return ACCESS_TOKEN_EXPIRY;
}

export function getRefreshTokenExpiry(): number {
  return REFRESH_TOKEN_EXPIRY;
}
