-- DraftClaw News and Optimization Migration
-- Migration: 003_news_and_optimization
-- Created: 2026-02-02

-- News tables
CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(50) NOT NULL,
    source_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('NBA', 'UFC', 'Soccer')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('player', 'team', 'league', 'betting', 'general')),
    metadata JSONB DEFAULT '{}',
    seo_title VARCHAR(255),
    seo_description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player news specific table
CREATE TABLE IF NOT EXISTS player_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    player_name VARCHAR(255) NOT NULL,
    player_team VARCHAR(255),
    injury_status VARCHAR(50),
    status_update TEXT,
    impact_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization: Add indexes for frequently accessed columns
-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport);
CREATE INDEX IF NOT EXISTS idx_events_commence_time ON events(commence_time);
CREATE INDEX IF NOT EXISTS idx_events_sport_commence_time ON events(sport, commence_time);
CREATE INDEX IF NOT EXISTS idx_events_external_id ON events(external_id);
CREATE INDEX IF NOT EXISTS idx_events_metadata ON events USING gin(metadata);

-- Odds snapshots table indexes
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_event_id ON odds_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_sportsbook ON odds_snapshots(sportsbook);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_market_type ON odds_snapshots(market_type);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_fetched_at ON odds_snapshots(fetched_at);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_compound ON odds_snapshots(event_id, sportsbook, market_type);

-- Picks table indexes
CREATE INDEX IF NOT EXISTS idx_picks_sport ON picks(sport);
CREATE INDEX IF NOT EXISTS idx_picks_type ON picks(type);
CREATE INDEX IF NOT EXISTS idx_picks_event_id ON picks(event_id);
CREATE INDEX IF NOT EXISTS idx_picks_generated_at ON picks(generated_at);
CREATE INDEX IF NOT EXISTS idx_picks_expires_at ON picks(expires_at);
CREATE INDEX IF NOT EXISTS idx_picks_is_active ON picks(is_active);
CREATE INDEX IF NOT EXISTS idx_picks_affiliate_links ON picks USING gin(affiliate_links);

-- News articles indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_sport ON news_articles(sport);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_slug ON news_articles(slug);
CREATE INDEX IF NOT EXISTS idx_news_articles_tags ON news_articles USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_news_articles_metadata ON news_articles USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_news_articles_is_featured ON news_articles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_news_articles_sport_published ON news_articles(sport, published_at);

-- Player news indexes
CREATE INDEX IF NOT EXISTS idx_player_news_player_name ON player_news(player_name);
CREATE INDEX IF NOT EXISTS idx_player_news_player_team ON player_news(player_team);
CREATE INDEX IF NOT EXISTS idx_player_news_injury_status ON player_news(injury_status);

-- Add triggers for updated_at
CREATE TRIGGER update_news_articles_updated_at
    BEFORE UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_news_updated_at
    BEFORE UPDATE ON player_news
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up old odds snapshots
CREATE OR REPLACE FUNCTION cleanup_old_odds_snapshots(days_to_keep INTEGER)
RETURNS void AS $$
BEGIN
    DELETE FROM odds_snapshots
    WHERE fetched_at < NOW() - (days_to_keep || ' days')::INTERVAL;
END;
$$ language 'plpgsql';
