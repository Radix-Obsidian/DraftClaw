-- DraftClaw Pick Expiration and Cleanup Migration
-- Migration: 004_pick_expiration_cleanup
-- Created: 2026-02-02

-- Add function to automatically deactivate expired picks
CREATE OR REPLACE FUNCTION deactivate_expired_picks()
RETURNS void AS $$
BEGIN
    UPDATE picks
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND (
        expires_at < NOW()
        OR (event_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = picks.event_id
            AND e.commence_time < NOW()
        ))
      );
END;
$$ language 'plpgsql';

-- Add function to clean up old completed picks (keep for 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_picks(days_to_keep INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
    DELETE FROM picks
    WHERE result IN ('won', 'lost', 'push', 'cancelled')
      AND settled_at < NOW() - (days_to_keep || ' days')::INTERVAL;
END;
$$ language 'plpgsql';

-- Add index for expired picks query optimization
CREATE INDEX IF NOT EXISTS idx_picks_expires_at ON picks(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_picks_event_commence ON picks(event_id) WHERE is_active = true;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_picks_settled_result ON picks(settled_at, result) WHERE result IS NOT NULL;

COMMENT ON FUNCTION deactivate_expired_picks() IS 'Deactivates picks that have expired or whose events have started';
COMMENT ON FUNCTION cleanup_old_picks(INTEGER) IS 'Removes old settled picks older than specified days (default 30)';
