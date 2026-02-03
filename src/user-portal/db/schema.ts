import { Type, type Static } from "@sinclair/typebox";

// User schema
export const UserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  phone: Type.Optional(Type.String()),
  passwordHash: Type.Optional(Type.String()),
  whatsappJid: Type.Optional(Type.String()),
  whatsappLinked: Type.Boolean({ default: false }),
  subscriptionTier: Type.Union([
    Type.Literal("free"),
    Type.Literal("pro"),
    Type.Literal("goat"),
  ], { default: "free" }),
  stripeCustomerId: Type.Optional(Type.String()),
  emailVerified: Type.Boolean({ default: false }),
  emailVerificationToken: Type.Optional(Type.String()),
  passwordResetToken: Type.Optional(Type.String()),
  passwordResetExpires: Type.Optional(Type.String({ format: "date-time" })),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export type User = Static<typeof UserSchema>;

// Subscription schema
export const SubscriptionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  userId: Type.String({ format: "uuid" }),
  planId: Type.Union([
    Type.Literal("free"),
    Type.Literal("pro_monthly"),
    Type.Literal("pro_yearly"),
    Type.Literal("goat_monthly"),
    Type.Literal("goat_yearly"),
  ]),
  status: Type.Union([
    Type.Literal("active"),
    Type.Literal("canceled"),
    Type.Literal("past_due"),
    Type.Literal("trialing"),
    Type.Literal("incomplete"),
  ]),
  stripeSubscriptionId: Type.Optional(Type.String()),
  stripePriceId: Type.Optional(Type.String()),
  currentPeriodStart: Type.String({ format: "date-time" }),
  currentPeriodEnd: Type.String({ format: "date-time" }),
  cancelAtPeriodEnd: Type.Boolean({ default: false }),
  canceledAt: Type.Optional(Type.String({ format: "date-time" })),
  trialStart: Type.Optional(Type.String({ format: "date-time" })),
  trialEnd: Type.Optional(Type.String({ format: "date-time" })),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export type Subscription = Static<typeof SubscriptionSchema>;

// Usage tracking schema
export const UsageRecordSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  userId: Type.String({ format: "uuid" }),
  metricType: Type.Union([
    Type.Literal("api_calls"),
    Type.Literal("messages_sent"),
    Type.Literal("messages_received"),
    Type.Literal("ai_tokens"),
    Type.Literal("media_uploads"),
  ]),
  metricValue: Type.Number(),
  periodStart: Type.String({ format: "date-time" }),
  periodEnd: Type.String({ format: "date-time" }),
  createdAt: Type.String({ format: "date-time" }),
});

export type UsageRecord = Static<typeof UsageRecordSchema>;

// Session schema for JWT tokens
export const SessionSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  userId: Type.String({ format: "uuid" }),
  token: Type.String(),
  refreshToken: Type.String(),
  expiresAt: Type.String({ format: "date-time" }),
  createdAt: Type.String({ format: "date-time" }),
  userAgent: Type.Optional(Type.String()),
  ipAddress: Type.Optional(Type.String()),
});

export type Session = Static<typeof SessionSchema>;

// Audit log schema
export const AuditLogSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  userId: Type.Optional(Type.String({ format: "uuid" })),
  action: Type.String(),
  resourceType: Type.String(),
  resourceId: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  ipAddress: Type.Optional(Type.String()),
  userAgent: Type.Optional(Type.String()),
  createdAt: Type.String({ format: "date-time" }),
});

export type AuditLog = Static<typeof AuditLogSchema>;

// Plan limits configuration
export const PlanLimitsSchema = Type.Object({
  planId: Type.String(),
  apiCallsPerMonth: Type.Number(),
  messagesPerMonth: Type.Number(),
  aiTokensPerMonth: Type.Number(),
  mediaUploadsMb: Type.Number(),
  maxWhatsAppAccounts: Type.Number(),
  prioritySupport: Type.Boolean(),
  customBranding: Type.Boolean(),
  teamMembers: Type.Number(),
});

export type PlanLimits = Static<typeof PlanLimitsSchema>;

// Default plan limits
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    planId: "free",
    apiCallsPerMonth: 1000,
    messagesPerMonth: 500,
    aiTokensPerMonth: 50000,
    mediaUploadsMb: 100,
    maxWhatsAppAccounts: 1,
    prioritySupport: false,
    customBranding: false,
    teamMembers: 1,
  },
  pro_monthly: {
    planId: "pro_monthly",
    apiCallsPerMonth: 50000,
    messagesPerMonth: 10000,
    aiTokensPerMonth: 1000000,
    mediaUploadsMb: 5000,
    maxWhatsAppAccounts: 5,
    prioritySupport: true,
    customBranding: true,
    teamMembers: 5,
  },
  pro_yearly: {
    planId: "pro_yearly",
    apiCallsPerMonth: 50000,
    messagesPerMonth: 10000,
    aiTokensPerMonth: 1000000,
    mediaUploadsMb: 5000,
    maxWhatsAppAccounts: 5,
    prioritySupport: true,
    customBranding: true,
    teamMembers: 5,
  },
  goat_monthly: {
    planId: "goat_monthly",
    apiCallsPerMonth: -1, // unlimited
    messagesPerMonth: -1,
    aiTokensPerMonth: -1,
    mediaUploadsMb: -1,
    maxWhatsAppAccounts: -1,
    prioritySupport: true,
    customBranding: true,
    teamMembers: -1,
  },
  goat_yearly: {
    planId: "goat_yearly",
    apiCallsPerMonth: -1,
    messagesPerMonth: -1,
    aiTokensPerMonth: -1,
    mediaUploadsMb: -1,
    maxWhatsAppAccounts: -1,
    prioritySupport: true,
    customBranding: true,
    teamMembers: -1,
  },
};
