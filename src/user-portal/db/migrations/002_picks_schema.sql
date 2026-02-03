-- DraftClaw Picks Database Schema
-- Migration: 002_picks_schema
-- Created: 2026-02-02

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sports events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('NBA', 'UFC', 'Soccer')),
    league VARCHAR(100) NOT NULL,
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    commence_time TIMESTAMP WITH TIME ZONE NOT NULL,
    external_id VARCHAR(100) UNIQUE,
    venue VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Odds snapshots table (stores historical odds from sportsbooks)
CREATE TABLE IF NOT EXISTS odds_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    sportsbook VARCHAR(50) NOT NULL,
    market_type VARCHAR(50) NOT NULL,
    outcome VARCHAR(255) NOT NULL,
    odds DECIMAL(10, 2) NOT NULL,
    line DECIMAL(10, 2),
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Picks table (AI-generated recommendations)
CREATE TABLE IF NOT EXISTS picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport VARCHAR(20) NOT NULL CHECK (sport IN ('NBA', 'UFC', 'Soccer')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('lock', 'longshot', 'trap')),
    matchup VARCHAR(255) NOT NULL,
    selection VARCHAR(255) NOT NULL,
    odds VARCHAR(20) NOT NULL,
    claw_edge DECIMAL(5, 2) NOT NULL,
    anchor_take TEXT NOT NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    game_time VARCHAR(100),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    affiliate_links JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticker items table (win/loss history for display)
CREATE TABLE IF NOT EXISTS ticker_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pick_id UUID REFERENCES picks(id) ON DELETE SET NULL,
    text VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('win', 'loss', 'pending')),
    result_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily briefings table
CREATE TABLE IF NOT EXISTS daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    confidence_level VARCHAR(20) NOT NULL CHECK (confidence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_sport ON events(sport);
CREATE INDEX IF NOT EXISTS idx_events_commence_time ON events(commence_time);
CREATE INDEX IF NOT EXISTS idx_events_external_id ON events(external_id);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_event_id ON odds_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_sportsbook ON odds_snapshots(sportsbook);
CREATE INDEX IF NOT EXISTS idx_odds_snapshots_fetched_at ON odds_snapshots(fetched_at);
CREATE INDEX IF NOT EXISTS idx_picks_sport ON picks(sport);
CREATE INDEX IF NOT EXISTS idx_picks_type ON picks(type);
CREATE INDEX IF NOT EXISTS idx_picks_is_active ON picks(is_active);
CREATE INDEX IF NOT EXISTS idx_picks_generated_at ON picks(generated_at);
CREATE INDEX IF NOT EXISTS idx_ticker_items_type ON ticker_items(type);
CREATE INDEX IF NOT EXISTS idx_ticker_items_result_timestamp ON ticker_items(result_timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_briefings_date ON daily_briefings(date);

-- Trigger for events updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for daily_briefings updated_at
DROP TRIGGER IF EXISTS update_daily_briefings_updated_at ON daily_briefings;
CREATE TRIGGER update_daily_briefings_updated_at
    BEFORE UPDATE ON daily_briefings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
