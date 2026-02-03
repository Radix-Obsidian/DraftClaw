-- DraftClaw Database Security Policies
-- Implements Row Level Security (RLS) and access controls
-- This file is idempotent - safe to run multiple times

-- Enable Row Level Security on user tables (skip if already enabled)
DO $$ BEGIN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

-- Enable RLS on sports data tables (skip if already enabled)
DO $$ BEGIN
    ALTER TABLE sportsbooks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

-- Create application roles (skip if already exists)
DO $$ BEGIN
    CREATE ROLE draftclaw_auth NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE ROLE draftclaw_anonymous NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Users table policies (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
        CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Subscriptions policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Only system can insert subscriptions') THEN
        CREATE POLICY "Only system can insert subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Only system can update subscriptions') THEN
        CREATE POLICY "Only system can update subscriptions" ON subscriptions FOR UPDATE USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Sessions policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Users can view their own sessions') THEN
        CREATE POLICY "Users can view their own sessions" ON sessions FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Users can delete their own sessions') THEN
        CREATE POLICY "Users can delete their own sessions" ON sessions FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- Usage records policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_records' AND policyname = 'Users can view their own usage') THEN
        CREATE POLICY "Users can view their own usage" ON usage_records FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'usage_records' AND policyname = 'System can insert usage records') THEN
        CREATE POLICY "System can insert usage records" ON usage_records FOR INSERT WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- Sports data policies (public read access)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sportsbooks' AND policyname = 'Anyone can view sportsbooks') THEN
        CREATE POLICY "Anyone can view sportsbooks" ON sportsbooks FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sportsbooks' AND policyname = 'System can manage sportsbooks') THEN
        CREATE POLICY "System can manage sportsbooks" ON sportsbooks FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Anyone can view events') THEN
        CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'System can manage events') THEN
        CREATE POLICY "System can manage events" ON events FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'odds_snapshots' AND policyname = 'Anyone can view odds') THEN
        CREATE POLICY "Anyone can view odds" ON odds_snapshots FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'odds_snapshots' AND policyname = 'System can manage odds') THEN
        CREATE POLICY "System can manage odds" ON odds_snapshots FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'picks' AND policyname = 'Anyone can view picks') THEN
        CREATE POLICY "Anyone can view picks" ON picks FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'picks' AND policyname = 'System can manage picks') THEN
        CREATE POLICY "System can manage picks" ON picks FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Audit logs policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can view their own audit logs') THEN
        CREATE POLICY "Users can view their own audit logs" ON audit_logs FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'System can insert audit logs') THEN
        CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- Create secure indexes for performance (skip if already exists)
DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_usage_records_user_id_period ON usage_records(user_id, period_start);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Function to clean up expired sessions (with rate limiting)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions_with_limit()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() 
    AND id IN (SELECT id FROM sessions WHERE expires_at < NOW() LIMIT 1000);
END;
$$ language 'plpgsql';

-- Function to audit sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_operations()
RETURNS trigger AS $$
BEGIN
    INSERT INTO audit_logs (
        action,
        resource_type,
        resource_id,
        user_id,
        metadata,
        ip_address
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text 
            ELSE NEW.id::text 
        END,
        auth.uid(),
        jsonb_build_object(
            'old_data', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
            'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
        ),
        current_setting('request.headers', true)::json->>'x-forwarded-for'
    );
    RETURN NULL;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Enable RLS on news tables (skip if already enabled)
DO $$ BEGIN
    ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE player_news ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN object_not_in_prerequisite_state THEN NULL; END $$;

-- News articles policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_articles' AND policyname = 'Anyone can view published news') THEN
        CREATE POLICY "Anyone can view published news" ON news_articles FOR SELECT USING (is_published = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'news_articles' AND policyname = 'System can manage news articles') THEN
        CREATE POLICY "System can manage news articles" ON news_articles FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Player news policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_news' AND policyname = 'Anyone can view player news') THEN
        CREATE POLICY "Anyone can view player news" ON player_news FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'player_news' AND policyname = 'System can manage player news') THEN
        CREATE POLICY "System can manage player news" ON player_news FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Add full-text search index for news
DO $idx$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_news_articles_fulltext 
    ON news_articles USING gin(to_tsvector('english', title || ' ' || content));
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
