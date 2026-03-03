-- Migration: 005_picks_compat (formerly 002_picks_schema)
-- Ensures picks-related tables and views exist (safe to run after 002_sports_data_schema)

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Events table (IF NOT EXISTS — 002_sports_data_schema may have created it)
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

-- Add result and settled_at columns to picks if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'picks' AND column_name = 'result') THEN
        ALTER TABLE picks ADD COLUMN result VARCHAR(20) CHECK (result IN ('won', 'lost', 'push', 'pending_result'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'picks' AND column_name = 'settled_at') THEN
        ALTER TABLE picks ADD COLUMN settled_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
