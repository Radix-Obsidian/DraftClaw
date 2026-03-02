import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type DbUser = {
  id: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  whatsapp_jid: string | null;
  whatsapp_linked: boolean;
  subscription_tier: "free" | "pro" | "goat" | "enterprise";
  is_admin: boolean;
  stripe_customer_id: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  password_reset_token: string | null;
  password_reset_expires: string | null;
  created_at: string;
  updated_at: string;
};

export type DbSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};

export type DbUsageRecord = {
  id: string;
  user_id: string;
  metric_type: "api_calls" | "messages_sent" | "messages_received" | "ai_tokens" | "media_uploads";
  metric_value: number;
  period_start: string;
  period_end: string;
  created_at: string;
};

export type DbSession = {
  id: string;
  user_id: string;
  token: string;
  refresh_token: string;
  expires_at: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
};

export type DbPick = {
  id: string;
  sport: "NBA" | "UFC" | "Soccer";
  type: "lock" | "longshot" | "trap";
  matchup: string;
  selection: string;
  odds: string;
  claw_edge: number;
  anchor_take: string;
  confidence: number;
  game_time: string | null;
  event_id: string | null;
  affiliate_links: Record<string, string>;
  is_active: boolean;
  generated_at: string;
  expires_at: string | null;
  created_at: string;
};

export type DbEvent = {
  id: string;
  sport: "NBA" | "UFC" | "Soccer";
  league: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  external_id: string | null;
  venue: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbOddsSnapshot = {
  id: string;
  event_id: string;
  sportsbook: string;
  market_type: string;
  outcome: string;
  odds: number;
  line: number | null;
  fetched_at: string;
  created_at: string;
};

export default supabase;
