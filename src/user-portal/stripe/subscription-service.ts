import type { Subscription } from "../db/schema.js";
import { PLAN_LIMITS } from "../db/schema.js";
import { supabase, type DbSubscription } from "../db/supabase-client.js";
import { stripeClient, STRIPE_PRICE_IDS, type StripeSubscription } from "./client.js";

export type PlanId = "free" | "pro_monthly" | "pro_yearly" | "goat_monthly" | "goat_yearly";

export interface SubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  checkoutUrl?: string;
  portalUrl?: string;
  error?: string;
}

function dbSubscriptionToSubscription(dbSub: DbSubscription): Subscription {
  return {
    id: dbSub.id,
    userId: dbSub.user_id,
    planId: dbSub.plan_id,
    status: dbSub.status,
    stripeSubscriptionId: dbSub.stripe_subscription_id || undefined,
    stripePriceId: dbSub.stripe_price_id || undefined,
    currentPeriodStart: dbSub.current_period_start,
    currentPeriodEnd: dbSub.current_period_end,
    cancelAtPeriodEnd: dbSub.cancel_at_period_end,
    canceledAt: dbSub.canceled_at || undefined,
    trialStart: dbSub.trial_start || undefined,
    trialEnd: dbSub.trial_end || undefined,
    createdAt: dbSub.created_at,
    updatedAt: dbSub.updated_at,
  };
}

export class SubscriptionService {
  async createFreeSubscription(userId: string): Promise<SubscriptionResult> {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 100); // Free tier doesn't expire

    // Delete any existing subscriptions for this user
    await supabase.from("subscriptions").delete().eq("user_id", userId);

    // Create new free subscription
    const { data: newSub, error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: "free",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (error || !newSub) {
      console.error("Failed to create free subscription:", error);
      return { success: false, error: "Failed to create subscription" };
    }

    const subscription = dbSubscriptionToSubscription(newSub as DbSubscription);
    return { success: true, subscription };
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data: dbSub, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !dbSub) {
      return null;
    }

    return dbSubscriptionToSubscription(dbSub as DbSubscription);
  }

  async createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    planId: PlanId;
    stripeCustomerId?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<SubscriptionResult> {
    if (params.planId === "free") {
      return { success: false, error: "Cannot create checkout for free plan" };
    }

    const priceId = STRIPE_PRICE_IDS[params.planId as keyof typeof STRIPE_PRICE_IDS];
    if (!priceId) {
      return { success: false, error: "Invalid plan ID" };
    }

    try {
      const session = await stripeClient.createCheckoutSession({
        customerId: params.stripeCustomerId,
        customerEmail: params.stripeCustomerId ? undefined : params.userEmail,
        priceId,
        successUrl: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: params.cancelUrl,
        metadata: {
          userId: params.userId,
          planId: params.planId,
        },
        trialPeriodDays: 14, // 14-day free trial
      });

      return { success: true, checkoutUrl: session.url };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create checkout session",
      };
    }
  }

  async createBillingPortalSession(params: {
    stripeCustomerId: string;
    returnUrl: string;
  }): Promise<SubscriptionResult> {
    try {
      const session = await stripeClient.createBillingPortalSession({
        customerId: params.stripeCustomerId,
        returnUrl: params.returnUrl,
      });

      return { success: true, portalUrl: session.url };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create billing portal session",
      };
    }
  }

  async handleCheckoutComplete(params: {
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: PlanId;
  }): Promise<SubscriptionResult> {
    try {
      const stripeSubscription = await stripeClient.getSubscription(params.stripeSubscriptionId);

      // Delete existing subscriptions for this user
      await supabase.from("subscriptions").delete().eq("user_id", params.userId);

      // Create new subscription in database
      const { data: newSub, error } = await supabase
        .from("subscriptions")
        .insert({
          user_id: params.userId,
          plan_id: params.planId,
          status: this.mapStripeStatus(stripeSubscription.status),
          stripe_subscription_id: params.stripeSubscriptionId,
          stripe_price_id: stripeSubscription.items.data[0]?.price.id,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          trial_start: stripeSubscription.trial_start
            ? new Date(stripeSubscription.trial_start * 1000).toISOString()
            : null,
          trial_end: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000).toISOString()
            : null,
        })
        .select()
        .single();

      if (error || !newSub) {
        console.error("Failed to create subscription:", error);
        return { success: false, error: "Failed to create subscription" };
      }

      const subscription = dbSubscriptionToSubscription(newSub as DbSubscription);
      return { success: true, subscription };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process checkout completion",
      };
    }
  }

  async handleSubscriptionUpdated(stripeSubscription: StripeSubscription): Promise<SubscriptionResult> {
    // Find subscription by Stripe ID
    const { data: dbSub, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("stripe_subscription_id", stripeSubscription.id)
      .single();

    if (fetchError || !dbSub) {
      return { success: false, error: "Subscription not found" };
    }

    // Update subscription
    const { data: updatedSub, error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: this.mapStripeStatus(stripeSubscription.status),
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        canceled_at: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
          : null,
      })
      .eq("id", dbSub.id)
      .select()
      .single();

    if (updateError || !updatedSub) {
      return { success: false, error: "Failed to update subscription" };
    }

    const subscription = dbSubscriptionToSubscription(updatedSub as DbSubscription);
    return { success: true, subscription };
  }

  async cancelSubscription(userId: string, immediately = false): Promise<SubscriptionResult> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { success: false, error: "No active subscription found" };
    }

    if (subscription.planId === "free") {
      return { success: false, error: "Cannot cancel free subscription" };
    }

    if (!subscription.stripeSubscriptionId) {
      return { success: false, error: "No Stripe subscription linked" };
    }

    try {
      await stripeClient.cancelSubscription(subscription.stripeSubscriptionId, immediately);

      if (immediately) {
        // Downgrade to free immediately
        return this.createFreeSubscription(userId);
      }

      // Update subscription in database
      const { data: updatedSub, error } = await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("id", subscription.id)
        .select()
        .single();

      if (error || !updatedSub) {
        return { success: false, error: "Failed to update subscription" };
      }

      return { success: true, subscription: dbSubscriptionToSubscription(updatedSub as DbSubscription) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel subscription",
      };
    }
  }

  async reactivateSubscription(userId: string): Promise<SubscriptionResult> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { success: false, error: "No subscription found" };
    }

    if (!subscription.stripeSubscriptionId || !subscription.cancelAtPeriodEnd) {
      return { success: false, error: "Subscription is not scheduled for cancellation" };
    }

    try {
      await stripeClient.reactivateSubscription(subscription.stripeSubscriptionId);

      // Update subscription in database
      const { data: updatedSub, error } = await supabase
        .from("subscriptions")
        .update({ cancel_at_period_end: false })
        .eq("id", subscription.id)
        .select()
        .single();

      if (error || !updatedSub) {
        return { success: false, error: "Failed to update subscription" };
      }

      return { success: true, subscription: dbSubscriptionToSubscription(updatedSub as DbSubscription) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reactivate subscription",
      };
    }
  }

  getPlanLimits(planId: string) {
    return PLAN_LIMITS[planId] || PLAN_LIMITS.free;
  }

  private mapStripeStatus(stripeStatus: string): Subscription["status"] {
    const statusMap: Record<string, Subscription["status"]> = {
      active: "active",
      canceled: "canceled",
      past_due: "past_due",
      trialing: "trialing",
      incomplete: "incomplete",
      incomplete_expired: "canceled",
      unpaid: "past_due",
    };
    return statusMap[stripeStatus] || "active";
  }
}

export const subscriptionService = new SubscriptionService();
