-- Migration: 006_goat_tier_fix
-- Fix CHECK constraints to allow goat subscription tiers

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'goat', 'enterprise'));

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_id_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_id_check
  CHECK (plan_id IN ('free', 'pro_monthly', 'pro_yearly', 'goat_monthly', 'goat_yearly', 'enterprise_monthly', 'enterprise_yearly'));
