import { request } from "undici";

// Stripe API configuration
const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.DRAFTCLAW_STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || process.env.DRAFTCLAW_STRIPE_WEBHOOK_SECRET || "";

// Price IDs - configure these in Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_monthly",
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "price_pro_yearly",
  goat_monthly: process.env.STRIPE_PRICE_GOAT_MONTHLY || "price_goat_monthly",
  goat_yearly: process.env.STRIPE_PRICE_GOAT_YEARLY || "price_goat_yearly",
};

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  trial_start?: number;
  trial_end?: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        product: string;
      };
    }>;
  };
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer: string;
  subscription?: string;
  status: string;
}

export interface StripeBillingPortalSession {
  id: string;
  url: string;
}

async function stripeRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
  body?: Record<string, unknown>,
): Promise<T> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not configured. Set STRIPE_SECRET_KEY environment variable.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  let requestBody: string | undefined;
  if (body) {
    const params = new URLSearchParams();
    flattenObject(body, params);
    requestBody = params.toString();
  }

  const response = await request(`${STRIPE_API_BASE}${endpoint}`, {
    method,
    headers,
    body: requestBody,
  });

  const data = await response.body.json() as T & { error?: { message: string } };

  if (response.statusCode >= 400) {
    const errorData = data as { error?: { message: string } };
    throw new Error(errorData.error?.message || `Stripe API error: ${response.statusCode}`);
  }

  return data;
}

function flattenObject(obj: Record<string, unknown>, params: URLSearchParams, prefix = ""): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, params, fullKey);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object") {
          flattenObject(item as Record<string, unknown>, params, `${fullKey}[${index}]`);
        } else {
          params.append(`${fullKey}[${index}]`, String(item));
        }
      });
    } else {
      params.append(fullKey, String(value));
    }
  }
}

export class StripeClient {
  // Customer management
  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    return stripeRequest<StripeCustomer>("/customers", "POST", {
      email: params.email,
      name: params.name,
      metadata: params.metadata,
    });
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    return stripeRequest<StripeCustomer>(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, params: {
    email?: string;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    return stripeRequest<StripeCustomer>(`/customers/${customerId}`, "POST", params);
  }

  // Subscription management
  async getSubscription(subscriptionId: string): Promise<StripeSubscription> {
    return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`);
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<StripeSubscription> {
    if (immediately) {
      return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, "DELETE");
    }
    return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, "POST", {
      cancel_at_period_end: true,
    });
  }

  async reactivateSubscription(subscriptionId: string): Promise<StripeSubscription> {
    return stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`, "POST", {
      cancel_at_period_end: false,
    });
  }

  async listCustomerSubscriptions(customerId: string): Promise<{ data: StripeSubscription[] }> {
    return stripeRequest<{ data: StripeSubscription[] }>(`/subscriptions?customer=${customerId}`);
  }

  // Checkout Sessions
  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
  }): Promise<StripeCheckoutSession> {
    const body: Record<string, unknown> = {
      mode: "subscription",
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: params.metadata,
      },
    };

    if (params.customerId) {
      body.customer = params.customerId;
    } else if (params.customerEmail) {
      body.customer_email = params.customerEmail;
    }

    if (params.trialPeriodDays) {
      (body.subscription_data as Record<string, unknown>).trial_period_days = params.trialPeriodDays;
    }

    return stripeRequest<StripeCheckoutSession>("/checkout/sessions", "POST", body);
  }

  async getCheckoutSession(sessionId: string): Promise<StripeCheckoutSession> {
    return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${sessionId}`);
  }

  // Billing Portal
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<StripeBillingPortalSession> {
    return stripeRequest<StripeBillingPortalSession>("/billing_portal/sessions", "POST", {
      customer: params.customerId,
      return_url: params.returnUrl,
    });
  }

  // Webhook signature verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("Stripe webhook secret not configured");
      return false;
    }

    try {
      const elements = signature.split(",");
      let timestamp = "";
      let v1Signature = "";

      for (const element of elements) {
        const [key, value] = element.split("=");
        if (key === "t") {
          timestamp = value;
        } else if (key === "v1") {
          v1Signature = value;
        }
      }

      if (!timestamp || !v1Signature) {
        return false;
      }

      // Check timestamp is within 5 minutes
      const timestampSeconds = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - timestampSeconds) > 300) {
        return false;
      }

      // Compute expected signature
      const { createHmac } = require("node:crypto");
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = createHmac("sha256", STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest("hex");

      return v1Signature === expectedSignature;
    } catch {
      return false;
    }
  }
}

export const stripeClient = new StripeClient();
