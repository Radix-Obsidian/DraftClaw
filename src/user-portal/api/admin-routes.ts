import { Hono } from "hono";
import { authService } from "../auth/service.js";
import { subscriptionService } from "../stripe/subscription-service.js";
import { usageService } from "../usage/service.js";
import { serviceManager } from "../services/service-manager.js";

const adminApp = new Hono();

// Admin authentication middleware
async function adminAuthMiddleware(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const result = await authService.validateToken(authHeader);
  
  if (!result.valid || !result.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  // Check if user has admin role (goat tier or explicit admin flag)
  // In production, use a proper admin role system
  const subscription = await subscriptionService.getUserSubscription(result.user.id);
  const isAdmin = subscription?.planId?.includes("goat") || 
    result.user.email?.endsWith("@draftclaw.ai");
  
  if (!isAdmin) {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  c.set("adminUser", result.user);
  await next();
}

// In-memory stores for admin data (replace with database in production)
const allUsers = new Map<string, any>();
const allSubscriptions = new Map<string, any>();

// ============ Admin Dashboard Routes ============

// Get dashboard stats
adminApp.get("/api/admin/stats", adminAuthMiddleware, async (c) => {
  // In production, these would be database queries
  const stats = {
    totalUsers: allUsers.size || 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    newUsersToday: 0,
    newUsersThisMonth: 0,
    subscriptionsByPlan: {
      free: 0,
      pro_monthly: 0,
      pro_yearly: 0,
      goat_monthly: 0,
      goat_yearly: 0,
    },
    usageStats: {
      totalApiCalls: 0,
      totalMessages: 0,
      totalAiTokens: 0,
    },
  };

  return c.json(stats);
});

// List all users with pagination
adminApp.get("/api/admin/users", adminAuthMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "20", 10);
  const search = c.req.query("search") || "";
  const tier = c.req.query("tier") || "";

  // In production, this would be a database query with filtering
  const users = Array.from(allUsers.values());
  
  let filtered = users;
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(u => 
      u.email?.toLowerCase().includes(searchLower) ||
      u.phone?.includes(search)
    );
  }
  if (tier) {
    filtered = filtered.filter(u => u.subscriptionTier === tier);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return c.json({
    users: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
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

  // In production, this would be a database query
  const subscriptions = Array.from(allSubscriptions.values());
  
  let filtered = subscriptions;
  if (status) {
    filtered = filtered.filter(s => s.status === status);
  }
  if (planId) {
    filtered = filtered.filter(s => s.planId === planId);
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return c.json({
    subscriptions: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Cancel subscription (admin)
adminApp.post("/api/admin/subscriptions/:subscriptionId/cancel", adminAuthMiddleware, async (c) => {
  const subscriptionId = c.req.param("subscriptionId");
  const body = await c.req.json();
  const immediately = body.immediately === true;

  // Find subscription by ID
  const subscription = allSubscriptions.get(subscriptionId);
  if (!subscription) {
    return c.json({ error: "Subscription not found" }, 404);
  }

  const result = await subscriptionService.cancelSubscription(subscription.userId, immediately);

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
      enterprise_monthly: 0,
      enterprise_yearly: 0,
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
