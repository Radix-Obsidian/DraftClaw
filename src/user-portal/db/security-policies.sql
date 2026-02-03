-- DraftClaw Database Security Policies
-- Implements Row Level Security (RLS) and access controls

-- Enable Row Level Security on user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sports data tables (public read, system write)
ALTER TABLE sportsbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;

-- Create application roles
DO $$ BEGIN
    CREATE ROLE draftclaw_auth NOLOGIN;
    CREATE ROLE draftclaw_anonymous NOLOGIN;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- Grant basic access to authenticated users
GRANT draftclaw_auth TO authenticated;
GRANT draftclaw_anonymous TO anon;

-- Users table policies
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Only system can insert subscriptions"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only system can update subscriptions"
    ON subscriptions FOR UPDATE
    USING (auth.role() = 'service_role');

-- Sessions policies
CREATE POLICY "Users can view their own sessions"
    ON sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
    ON sessions FOR DELETE
    USING (user_id = auth.uid());

-- Usage records policies
CREATE POLICY "Users can view their own usage"
    ON usage_records FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can insert usage records"
    ON usage_records FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Sports data policies (public read access)
CREATE POLICY "Anyone can view sportsbooks"
    ON sportsbooks FOR SELECT
    USING (true);

CREATE POLICY "System can insert sportsbooks"
    ON sportsbooks FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update sportsbooks"
    ON sportsbooks FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete sportsbooks"
    ON sportsbooks FOR DELETE
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view events"
    ON events FOR SELECT
    USING (true);

CREATE POLICY "System can insert events"
    ON events FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update events"
    ON events FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete events"
    ON events FOR DELETE
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view odds"
    ON odds_snapshots FOR SELECT
    USING (true);

CREATE POLICY "System can insert odds"
    ON odds_snapshots FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update odds"
    ON odds_snapshots FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete odds"
    ON odds_snapshots FOR DELETE
    USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view picks"
    ON picks FOR SELECT
    USING (true);

CREATE POLICY "System can insert picks"
    ON picks FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update picks"
    ON picks FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete picks"
    ON picks FOR DELETE
    USING (auth.role() = 'service_role');

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Create secure indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id_period ON usage_records(user_id, period_start);

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

-- Enable RLS on news tables
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_news ENABLE ROW LEVEL SECURITY;

-- News articles policies (public read, system write)
CREATE POLICY "Anyone can view published news"
    ON news_articles FOR SELECT
    USING (is_published = true);

CREATE POLICY "System can insert news articles"
    ON news_articles FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update news articles"
    ON news_articles FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete news articles"
    ON news_articles FOR DELETE
    USING (auth.role() = 'service_role');

-- Player news policies
CREATE POLICY "Anyone can view player news"
    ON player_news FOR SELECT
    USING (true);

CREATE POLICY "System can insert player news"
    ON player_news FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "System can update player news"
    ON player_news FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY "System can delete player news"
    ON player_news FOR DELETE
    USING (auth.role() = 'service_role');

-- Add full-text search index for news
CREATE INDEX IF NOT EXISTS idx_news_articles_fulltext 
    ON news_articles USING gin(to_tsvector('english', title || ' ' || content));
