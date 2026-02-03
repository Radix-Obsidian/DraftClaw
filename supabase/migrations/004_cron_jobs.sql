-- DraftClaw Cron Jobs Migration
-- Migration: 004_cron_jobs
-- Created: 2026-02-02

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Sitemap generation cron job (runs daily at 3 AM UTC)
SELECT cron.schedule(
  'generate-sitemap',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-sitemap',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- News sync cron job (runs every 15 minutes)
SELECT cron.schedule(
  'sync-news-feed',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Odds sync cron job (runs every 5 minutes)
SELECT cron.schedule(
  'sync-odds-data',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-odds',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cleanup old odds snapshots cron job (runs daily at 4 AM UTC)
SELECT cron.schedule(
  'cleanup-old-snapshots',
  '0 4 * * *',
  $$
  SELECT cleanup_old_odds_snapshots(30);
  $$
);

-- Cleanup expired sessions cron job (runs hourly)
SELECT cron.schedule(
  'cleanup-expired-sessions',
  '0 * * * *',
  $$
  SELECT cleanup_expired_sessions();
  $$
);
