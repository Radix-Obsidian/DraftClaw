-- DraftClaw Sports Data Schema
-- Migration: 002_sports_data_schema
-- Created: 2026-02-02
-- This must run BEFORE 003_news_and_optimization.sql

-- Sportsbooks table
CREATE TABLE IF NOT EXISTS sportsbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    key VARCHAR(50) NOT NULL UNIQUE,
    is_sharp BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    logo_url TEXT,
    affiliate_base_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table (games/matches)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) NOT NULL UNIQUE,
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('NBA', 'NFL', 'UFC', 'Soccer', 'MLB', 'NHL', 'NCAAB', 'NCAAW')),
    league VARCHAR(100),
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    commence_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled', 'postponed')),
    home_score INTEGER,
    away_score INTEGER,
    venue VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds snapshots table (timestamped odds for events)
CREATE TABLE IF NOT EXISTS odds_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sportsbook VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) NOT NULL CHECK (market_type IN ('h2h', 'spreads', 'totals', 'props', 'futures')),
    outcome_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    point DECIMAL(10, 2),
    american_odds INTEGER,
    implied_probability DECIMAL(5, 4),
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Picks table (AI-generated picks and analysis)
CREATE TABLE IF NOT EXISTS picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('NBA', 'NFL', 'UFC', 'Soccer', 'MLB', 'NHL', 'NCAAB', 'NCAAW')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('moneyline', 'spread', 'total', 'prop', 'parlay')),
    pick_description TEXT NOT NULL,
    analysis TEXT,
    confidence DECIMAL(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
    expected_value DECIMAL(10, 4),
    recommended_units DECIMAL(5, 2),
    best_odds DECIMAL(10, 2),
    best_sportsbook VARCHAR(50),
    sharp_line DECIMAL(10, 2),
    retail_line DECIMAL(10, 2),
    edge_percentage DECIMAL(5, 2),
    affiliate_links JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    result VARCHAR(20) CHECK (result IN ('pending', 'won', 'lost', 'push', 'cancelled')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    settled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default sportsbooks
INSERT INTO sportsbooks (name, key, is_sharp, affiliate_base_url) VALUES
    ('Pinnacle', 'pinnacle', true, NULL),
    ('Circa', 'circa', true, NULL),
    ('FanDuel', 'fanduel', false, 'https://www.fanduel.com'),
    ('DraftKings', 'draftkings', false, 'https://www.draftkings.com'),
    ('BetMGM', 'betmgm', false, 'https://www.betmgm.com'),
    ('Caesars', 'caesars', false, 'https://www.caesars.com'),
    ('BetRivers', 'betrivers', false, 'https://www.betrivers.com'),
    ('PointsBet', 'pointsbet', false, 'https://www.pointsbet.com')
ON CONFLICT (key) DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER update_sportsbooks_updated_at
    BEFORE UPDATE ON sportsbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_picks_updated_at
    BEFORE UPDATE ON picks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Basic indexes (more will be added in 003)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_event_sportsbook ON odds_snapshots(event_id, sportsbook);
CREATE INDEX IF NOT EXISTS idx_picks_result ON picks(result);
