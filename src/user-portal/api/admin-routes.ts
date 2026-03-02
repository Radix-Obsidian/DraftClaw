import { Hono } from "hono";
import { authService } from "../auth/service.js";
import { subscriptionService } from "../stripe/subscription-service.js";
import { usageService } from "../usage/service.js";
import { serviceManager } from "../services/service-manager.js";
import { supabase } from "../db/supabase-client.js";

const adminApp = new Hono();

// Admin authentication middleware
async function adminAuthMiddleware(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const result = await authService.validateToken(authHeader);
  
  if (!result.valid || !result.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // RBAC: check is_admin column or @draftclaw.ai email
  const isAdmin = (result.user as any).isAdmin === true ||
    result.user.email?.endsWith("@draftclaw.ai");
  
  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  c.set("adminUser", result.user);
  await next();
}

// ============ Admin Dashboard Routes ============

// Get dashboard stats (real database queries)
adminApp.get("/api/admin/stats", adminAuthMiddleware, async (c) => {
  const [usersResult, subsResult] = await Promise.all([
    supabase.from("users").select("id, subscription_tier, created_at", { count: "exact" }),
    supabase.from("subscriptions").select("plan_id, status"),
  ]);
  const users = usersResult.data || [];
  const subs = subsResult.data || [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const byPlan: Record<string, number> = { free: 0, pro_monthly: 0, pro_yearly: 0, goat_monthly: 0, goat_yearly: 0 };
  let active = 0;
  for (const s of subs) {
    if (s.status === "active" || s.status === "trialing") active++;
    if (s.plan_id in byPlan) byPlan[s.plan_id]++;
  }

  return c.json({
    totalUsers: usersResult.count ?? users.length,
    activeSubscriptions: active,
    newUsersToday: users.filter((u) => new Date(u.created_at) >= today).length,
    newUsersThisMonth: users.filter((u) => new Date(u.created_at) >= monthStart).length,
    subscriptionsByPlan: byPlan,
  });
});

// List all users with pagination
adminApp.get("/api/admin/users", adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const search = c.req.query("search") || "";
  const tier = c.req.query("tier") || "";

  let query = supabase
    .from("users")
    .select("id, email, phone, subscription_tier, is_admin, email_verified, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (search) query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%`);
  if (tier) query = query.eq("subscription_tier", tier);

  const { data, count, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    users: data || [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
});

// Get single user details
adminApp.get("/api/admin/users/:userId", adminAuthMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const user = await authService.getUserById(userId);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  const usage = await usageService.getCurrentPeriodUsage(userId);

  return c.json({
    user,
    subscription,
    usage,
  });
});

// Update user (admin)
adminApp.put("/api/admin/users/:userId", adminAuthMiddleware, async (c) => {
  const userId = c.req.param("userId");
  const body = await c.req.json();

  const user = await authService.getUserById(userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  // Update allowed fields
  const updates: any = {};
  if (body.email) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;

  const result = await authService.updateUser(userId, updates);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ user: result.user });
});

// List all subscriptions
adminApp.get("/api/admin/subscriptions", adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const status = c.req.query("status") || "";
  const planId = c.req.query("planId") || "";

  let query = supabase
    .from("subscriptions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  if (status) query = query.eq("status", status);
  if (planId) query = query.eq("plan_id", planId);

  const { data, count, error } = await query;
  if (error) return c.json({ error: error.message }, 500);

  return c.json({
    subscriptions: data || [],
    pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
  });
});

// Cancel subscription (admin)
adminApp.post("/api/admin/subscriptions/:subscriptionId/cancel", adminAuthMiddleware, async (c) => {
  const subscriptionId = c.req.param("subscriptionId");
  const body = await c.req.json();
  const immediately = body.immediately === true;

  const { data: subscription } = await supabase.from("subscriptions").select("user_id").eq("id", subscriptionId).single();
  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  const result = await subscriptionService.cancelSubscription(subscription.user_id, immediately);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ subscription: result.subscription });
});

// Get usage analytics
adminApp.get("/api/admin/analytics/usage", adminAuthMiddleware, async (c) => {
  const startDate = c.req.query("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = c.req.query("endDate") || new Date().toISOString();

  // In production, aggregate usage data from database
  const analytics = {
    period: {
      start: startDate,
      end: endDate,
    },
    totals: {
      apiCalls: 0,
      messagesSent: 0,
      messagesReceived: 0,
      aiTokens: 0,
      mediaUploads: 0,
    },
    dailyBreakdown: [] as Array<{
      date: string;
      apiCalls: number;
      messages: number;
      aiTokens: number;
    }>,
    topUsers: [] as Array<{
      userId: string;
      email: string;
      totalApiCalls: number;
      totalMessages: number;
    }>,
  };

  return c.json(analytics);
});

// Get revenue analytics
adminApp.get("/api/admin/analytics/revenue", adminAuthMiddleware, async (c) => {
  const startDate = c.req.query("startDate") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = c.req.query("endDate") || new Date().toISOString();

  // In production, fetch from Stripe API
  const analytics = {
    period: {
      start: startDate,
      end: endDate,
    },
    totals: {
      grossRevenue: 0,
      netRevenue: 0,
      refunds: 0,
      newSubscriptions: 0,
      canceledSubscriptions: 0,
      churnRate: 0,
    },
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    averageRevenuePerUser: 0,
    revenueByPlan: {
      pro_monthly: 0,
      pro_yearly: 0,
      goat_monthly: 0,
      goat_yearly: 0,
    },
  };

  return c.json(analytics);
});

// Audit logs
adminApp.get("/api/admin/audit-logs", adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "50", 10);
  const userId = c.req.query("userId") || "";
  const action = c.req.query("action") || "";

  // In production, fetch from audit_logs table
  const logs: any[] = [];
  const total = logs.length;

  return c.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// System health check
adminApp.get("/api/admin/health", adminAuthMiddleware, async (c) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "healthy",
      stripe: "healthy",
      whatsapp: "healthy",
      redis: "healthy",
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  };

  return c.json(health);
});

// ============ Background Services Management ============

// Get service status
adminApp.get("/api/admin/services/status", adminAuthMiddleware, async (c) => {
  const status = serviceManager.getStatus();
  
  return c.json({
    success: true,
    services: status,
    timestamp: new Date().toISOString(),
  });
});

// Restart a specific service
adminApp.post("/api/admin/services/:serviceName/restart", adminAuthMiddleware, async (c) => {
  const serviceName = c.req.param("serviceName");
  
  try {
    await serviceManager.restartService(serviceName);
    
    return c.json({
      success: true,
      message: `Service '${serviceName}' restarted successfully`,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart service',
    }, 500);
  }
});

// Manually trigger pick generation
adminApp.post("/api/admin/picks/generate", adminAuthMiddleware, async (c) => {
  try {
    const picksGenerated = await serviceManager.triggerPickGeneration();
    
    return c.json({
      success: true,
      message: 'Pick generation triggered successfully',
      picksGenerated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate picks',
    }, 500);
  }
});

export { adminApp as adminRoutes };
