import { Hono } from "hono";
import { cors } from "hono/cors";
import { authService } from "../auth/service.js";
import { subscriptionService, type PlanId } from "../stripe/subscription-service.js";
import { stripeClient } from "../stripe/client.js";
import { usageService } from "../usage/service.js";
import picksRouter from "../picks/routes.js";
import { adminRoutes } from "./admin-routes.js";

const app = new Hono();

// CORS middleware
const corsOrigin = process.env.DRAFTCLAW_PORTAL_ORIGIN || "https://draftclaw.ai";
if (process.env.NODE_ENV === "production" && !process.env.DRAFTCLAW_PORTAL_ORIGIN) {
  console.warn("[WARN] DRAFTCLAW_PORTAL_ORIGIN not set — defaulting to https://draftclaw.ai");
}
app.use("/*", cors({
  origin: corsOrigin,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Rate limiter (per IP)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function makeRateLimiter(maxRequests: number, windowMs: number) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    let entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimitStore.set(key, entry);
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return c.json({ error: "Too many requests", retryAfter: Math.ceil((entry.resetAt - now) / 1000) }, 429);
    }
    await next();
  };
}
app.use("/api/auth/login", makeRateLimiter(10, 60_000));
app.use("/api/auth/register", makeRateLimiter(5, 3_600_000));
app.use("/api/auth/refresh", makeRateLimiter(30, 60_000));

// Auth middleware
async function authMiddleware(c: any, next: () => Promise<void>) {
  const authHeader = c.req.header("Authorization");
  const result = await authService.validateToken(authHeader);
  
  if (!result.valid || !result.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  
  c.set("user", result.user);
  c.set("tokenPayload", result.payload);
  await next();
}

// Health check
app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// ============ Auth Routes ============

// Register
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, phone } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const result = await authService.register({ email, password, phone });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    // Create free subscription for new user
    if (result.user) {
      await subscriptionService.createFreeSubscription(result.user.id);
    }

    return c.json({
      user: result.user,
      tokens: result.tokens,
    }, 201);
  } catch (error) {
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Login
app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const result = await authService.login({ email, password });

    if (!result.success) {
      return c.json({ error: result.error }, 401);
    }

    return c.json({
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    return c.json({ error: "Login failed" }, 500);
  }
});

// Logout
app.post("/api/auth/logout", async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Logout failed" }, 500);
  }
});

// Refresh tokens
app.post("/api/auth/refresh", async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: "Refresh token is required" }, 400);
    }

    const result = await authService.refreshTokens(refreshToken);

    if (!result.success) {
      return c.json({ error: result.error }, 401);
    }

    return c.json({
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    return c.json({ error: "Token refresh failed" }, 500);
  }
});

// Password reset request
app.post("/api/auth/forgot-password", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    await authService.requestPasswordReset(email);
    // Always return success to prevent email enumeration
    return c.json({ success: true, message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    return c.json({ error: "Password reset request failed" }, 500);
  }
});

// Password reset
app.post("/api/auth/reset-password", async (c) => {
  try {
    const body = await c.req.json();
    const { token, password } = body;

    if (!token || !password) {
      return c.json({ error: "Token and password are required" }, 400);
    }

    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Password reset failed" }, 500);
  }
});

// ============ User Routes (Protected) ============

// Get current user profile
app.get("/api/user/profile", authMiddleware, async (c) => {
  const user = c.get("user");
  const subscription = await subscriptionService.getUserSubscription(user.id);
  const planLimits = subscriptionService.getPlanLimits(subscription?.planId || "free");

  return c.json({
    user,
    subscription,
    planLimits,
  });
});

// Update user profile
app.put("/api/user/profile", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { email, phone } = body;

    const result = await authService.updateUser(user.id, { email, phone });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ user: result.user });
  } catch (error) {
    return c.json({ error: "Profile update failed" }, 500);
  }
});

// Change password
app.post("/api/user/change-password", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json({ error: "Current and new password are required" }, 400);
    }

    const result = await authService.changePassword(user.id, currentPassword, newPassword);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Password change failed" }, 500);
  }
});

// ============ WhatsApp Linking Routes ============

// Link WhatsApp account
app.post("/api/user/link-whatsapp", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { whatsappJid } = body;

    if (!whatsappJid) {
      return c.json({ error: "WhatsApp JID is required" }, 400);
    }

    const result = await authService.linkWhatsApp({
      userId: user.id,
      whatsappJid,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ user: result.user });
  } catch (error) {
    return c.json({ error: "WhatsApp linking failed" }, 500);
  }
});

// Unlink WhatsApp account
app.post("/api/user/unlink-whatsapp", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const result = await authService.unlinkWhatsApp(user.id);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ user: result.user });
  } catch (error) {
    return c.json({ error: "WhatsApp unlinking failed" }, 500);
  }
});

// ============ Subscription Routes ============

// Get subscription details
app.get("/api/user/subscription", authMiddleware, async (c) => {
  const user = c.get("user");
  const subscription = await subscriptionService.getUserSubscription(user.id);
  const planLimits = subscriptionService.getPlanLimits(subscription?.planId || "free");

  return c.json({
    subscription,
    planLimits,
  });
});

// Create checkout session for upgrade
app.post("/api/user/subscription/checkout", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { planId } = body;

    if (!planId || planId === "free") {
      return c.json({ error: "Valid plan ID is required" }, 400);
    }

    const baseUrl = process.env.DRAFTCLAW_PORTAL_URL || "http://localhost:3000";
    const result = await subscriptionService.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planId: planId as PlanId,
      stripeCustomerId: user.stripeCustomerId,
      successUrl: `${baseUrl}/subscription/success`,
      cancelUrl: `${baseUrl}/subscription/cancel`,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ checkoutUrl: result.checkoutUrl });
  } catch (error) {
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Get billing portal URL
app.post("/api/user/subscription/portal", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    if (!user.stripeCustomerId) {
      return c.json({ error: "No billing account found" }, 400);
    }

    const baseUrl = process.env.DRAFTCLAW_PORTAL_URL || "http://localhost:3000";
    const result = await subscriptionService.createBillingPortalSession({
      stripeCustomerId: user.stripeCustomerId,
      returnUrl: `${baseUrl}/dashboard`,
    });

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ portalUrl: result.portalUrl });
  } catch (error) {
    return c.json({ error: "Failed to create billing portal session" }, 500);
  }
});

// Cancel subscription
app.post("/api/user/subscription/cancel", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const { immediately } = body;

    const result = await subscriptionService.cancelSubscription(user.id, immediately === true);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ subscription: result.subscription });
  } catch (error) {
    return c.json({ error: "Failed to cancel subscription" }, 500);
  }
});

// Reactivate subscription
app.post("/api/user/subscription/reactivate", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const result = await subscriptionService.reactivateSubscription(user.id);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ subscription: result.subscription });
  } catch (error) {
    return c.json({ error: "Failed to reactivate subscription" }, 500);
  }
});

// ============ Usage Routes ============

// Get usage summary
app.get("/api/user/usage", authMiddleware, async (c) => {
  const user = c.get("user");
  const subscription = await subscriptionService.getUserSubscription(user.id);
  const planLimits = subscriptionService.getPlanLimits(subscription?.planId || "free");
  const usage = await usageService.getCurrentPeriodUsage(user.id);

  return c.json({
    usage,
    limits: planLimits,
    subscription,
  });
});

// ============ Picks Routes (Public) ============

app.route("/api/picks", picksRouter);

// ============ Admin Routes ============

app.route("/", adminRoutes);

// ============ Stripe Webhook ============

app.post("/api/webhooks/stripe", async (c) => {
  try {
    const signature = c.req.header("stripe-signature");
    const payload = await c.req.text();

    if (!signature || !stripeClient.verifyWebhookSignature(payload, signature)) {
      return c.json({ error: "Invalid signature" }, 400);
    }

    const event = JSON.parse(payload);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};
        
        if (metadata.userId && metadata.planId) {
          await subscriptionService.handleCheckoutComplete({
            userId: metadata.userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            planId: metadata.planId as PlanId,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await subscriptionService.handleSubscriptionUpdated(subscription);
        break;
      }

      case "invoice.paid": {
        // Subscription renewed successfully
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripeClient.getSubscription(invoice.subscription);
          await subscriptionService.handleSubscriptionUpdated(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        // Payment failed - subscription may become past_due
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subscription = await stripeClient.getSubscription(invoice.subscription);
          await subscriptionService.handleSubscriptionUpdated(subscription);
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return c.json({ error: "Webhook processing failed" }, 500);
  }
});

// ============ Static Pages ============

// About page
app.get("/about", async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About - DraftClaw</title>
  <meta name="description" content="Learn about DraftClaw, the Autonomous Moneyball Engine for sports betting intelligence.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#6366f1',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <a href="/" class="flex items-center gap-3">
        <img src="/logo.png" alt="DraftClaw" style="height: 40px; width: auto;" />
        <span class="text-3xl font-bold text-gray-900 dark:text-white">DraftClaw</span>
      </a>
      </div>
    </div>
  </header>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">About DraftClaw</h1>
    <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
      DraftClaw is the Autonomous Moneyball Engine — a sports intelligence platform that tracks 
      sharp money movements and provides real-time Expected Value calculations against the books.
    </p>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Our Mission</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      We believe that informed bettors make better decisions. By tracking line movements, 
      analyzing sharp book prices, and monitoring real-time news, DraftClaw gives you the 
      edge you need to identify value in the market.
    </p>
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Responsible Gaming</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      DraftClaw is a sports intelligence platform, not a sportsbook. We provide data and analysis 
      to help you make informed decisions. Always gamble responsibly. If you have a gambling problem, call 1-800-GAMBLER.
    </p>
  </main>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">© 2026 DraftClaw. 21+ Only. Gamble Responsibly.</p>
    </div>
  </footer>
</body>
</html>`);
});

// Terms page
app.get("/terms", async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service - DraftClaw</title>
  <meta name="description" content="Terms of Service for DraftClaw sports intelligence platform.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#6366f1',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <a href="/" class="flex items-center gap-3">
        <img src="/logo.png" alt="DraftClaw" style="height: 40px; width: auto;" />
        <span class="text-3xl font-bold text-gray-900 dark:text-white">DraftClaw</span>
      </a>
      </div>
    </div>
  </header>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Terms of Service</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: February 2, 2026</p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      By accessing DraftClaw, you agree to these Terms. You must be at least 21 years of age to use our service.
    </p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. No Gambling Advice</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      DraftClaw provides data and analysis for entertainment purposes only. We are NOT a sportsbook and do not accept wagers. All betting decisions are made at your own risk.
    </p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Responsible Gaming</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      If you feel you may have a gambling problem, contact the National Council on Problem Gambling: 1-800-522-4700 or visit www.ncpgambling.org.
    </p>
  </main>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">© 2026 DraftClaw. 21+ Only. Gamble Responsibly.</p>
    </div>
  </footer>
</body>
</html>`);
});

// Privacy page
app.get("/privacy", async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - DraftClaw</title>
  <meta name="description" content="Privacy Policy for DraftClaw sports intelligence platform.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#6366f1',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <a href="/" class="flex items-center gap-3">
        <img src="/logo.png" alt="DraftClaw" style="height: 40px; width: auto;" />
        <span class="text-3xl font-bold text-gray-900 dark:text-white">DraftClaw</span>
      </a>
      </div>
    </div>
  </header>
  <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Privacy Policy</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: February 2, 2026</p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      We collect email, password (hashed), usage data, and payment information through Stripe. We never store full credit card numbers.
    </p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      All data is encrypted in transit (HTTPS) and at rest. Passwords are hashed using bcrypt.
    </p>
    
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights</h2>
    <p class="text-gray-600 dark:text-gray-300 mb-6">
      You can access, correct, or delete your data at any time. Contact privacy@draftclaw.ai for requests.
    </p>
  </main>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">© 2026 DraftClaw. 21+ Only. Gamble Responsibly.</p>
    </div>
  </footer>
</body>
</html>`);
});

export { app as userPortalRoutes };
