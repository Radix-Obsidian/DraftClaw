/**
 * Data Pipeline Verification Test Suite
 * Run with: npm test -- --testPathPattern=data-pipeline
 */

import axios from 'axios';
import { Pool } from 'pg';

// Test configuration
const config = {
  theOddsApi: {
    key: process.env.ODDS_API_KEY,
    host: process.env.ODDS_API_HOST || 'https://api.the-odds-api.com/v4',
  },
  sportradar: {
    basketball: {
      key: process.env.SPORTRADAR_BASKETBALL_API_KEY,
      host: process.env.SPORTRADAR_BASKETBALL_HOST || 'https://api.sportradar.com/basketball',
    },
    soccer: {
      key: process.env.SPORTRADAR_SOCCER_API_KEY,
      host: process.env.SPORTRADAR_SOCCER_HOST || 'https://api.sportradar.com/soccer',
    },
    globalBasketball: {
      key: process.env.SPORTRADAR_GLOBAL_BASKETBALL_KEY,
      host: process.env.SPORTRADAR_GLOBAL_BASKETBALL_HOST || 'https://api.sportradar.com/global-basketball',
    },
    mma: {
      key: process.env.SPORTRADAR_MMA_API_KEY,
      host: process.env.SPORTRADAR_MMA_HOST || 'https://api.sportradar.com/mma',
    },
  },
  sportsData: {
    key: process.env.SPORTSDATA_API_KEY,
    host: process.env.SPORTSDATA_API_HOST || 'https://api.sportsdata.io/v3',
  },
  database: {
    connectionString: process.env.DATABASE_URL,
  },
};

describe('Data Pipeline Verification', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: config.database.connectionString,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('API Connectivity', () => {
    describe('The Odds API', () => {
      it('should fetch sports list', async () => {
        if (!config.theOddsApi.key) {
          console.warn('The Odds API key not configured, skipping test');
          return;
        }

        const response = await axios.get(`${config.theOddsApi.host}/sports`, {
          params: { apiKey: config.theOddsApi.key },
          timeout: 10000,
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        
        const sports = response.data.map((s: any) => s.key);
        expect(sports).toContain('basketball_nba');
        expect(sports).toContain('mma');
        expect(sports).toContain('soccer');
      });

      it('should fetch NBA odds', async () => {
        if (!config.theOddsApi.key) {
          console.warn('The Odds API key not configured, skipping test');
          return;
        }

        const response = await axios.get(`${config.theOddsApi.host}/odds`, {
          params: {
            apiKey: config.theOddsApi.key,
            sport: 'basketball_nba',
            region: 'us',
          },
          timeout: 10000,
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
      });
    });

    describe('Sportradar APIs', () => {
      it('should have Basketball API configured', () => {
        expect(config.sportradar.basketball.key).toBeDefined();
      });

      it('should have Soccer API configured', () => {
        expect(config.sportradar.soccer.key).toBeDefined();
      });

      it('should have Global Basketball API configured', () => {
        expect(config.sportradar.globalBasketball.key).toBeDefined();
      });

      it('should have MMA API configured', () => {
        expect(config.sportradar.mma.key).toBeDefined();
      });
    });

    describe('SportsData.io', () => {
      it('should have API key configured', () => {
        expect(config.sportsData.key).toBeDefined();
      });
    });
  });

  describe('Database Schema', () => {
    it('should connect to database', async () => {
      const result = await pool.query('SELECT 1');
      expect(result.rows[0]['?column?']).toBe(1);
    });

    it('should have events table', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'events'
      `);
      
      const columns = result.rows.map((r: any) => r.column_name);
      expect(columns).toContain('id');
      expect(columns).toContain('sport');
      expect(columns).toContain('home_team');
      expect(columns).toContain('away_team');
    });

    it('should have odds_snapshots table', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'odds_snapshots'
      `);
      
      const columns = result.rows.map((r: any) => r.column_name);
      expect(columns).toContain('event_id');
      expect(columns).toContain('sportsbook');
      expect(columns).toContain('market_type');
      expect(columns).toContain('price');
    });

    it('should have news_articles table', async () => {
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'news_articles'
      `);
      
      const columns = result.rows.map((r: any) => r.column_name);
      expect(columns).toContain('title');
      expect(columns).toContain('slug');
      expect(columns).toContain('sport');
      expect(columns).toContain('seo_title');
    });

    it('should support NCAAB and NCAAW sports', async () => {
      const result = await pool.query(`
        SELECT enumlabel 
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        JOIN pg_type tp ON tp.typname = 'sport'
        WHERE t.typname = 'sport'
      `);
      
      const sports = result.rows.map((r: any) => r.enumlabel);
      expect(sports).toContain('NCAAB');
      expect(sports).toContain('NCAAW');
    });
  });

  describe('Indexes', () => {
    it('should have indexes on events table', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'events'
      `);
      
      const indexes = result.rows.map((r: any) => r.indexname);
      expect(indexes).toContain('idx_events_status');
    });

    it('should have indexes on odds_snapshots table', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'odds_snapshots'
      `);
      
      const indexes = result.rows.map((r: any) => r.indexname);
      expect(indexes).toContain('idx_odds_snapshots_event_sportsbook');
    });

    it('should have full-text search index on news', async () => {
      const result = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'news_articles'
      `);
      
      const indexes = result.rows.map((r: any) => r.indexname);
      expect(indexes).toContain('idx_news_articles_fulltext');
    });
  });

  describe('RLS Policies', () => {
    it('should have RLS enabled on events', async () => {
      const result = await pool.query(`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'events'
      `);
      
      expect(result.rows[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on odds_snapshots', async () => {
      const result = await pool.query(`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'odds_snapshots'
      `);
      
      expect(result.rows[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on news_articles', async () => {
      const result = await pool.query(`
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'news_articles'
      `);
      
      expect(result.rows[0].relrowsecurity).toBe(true);
    });
  });

  describe('Real-Time Data Fetching', () => {
    it('should fetch live NBA odds', async () => {
      if (!config.theOddsApi.key) {
        console.warn('The Odds API key not configured, skipping test');
        return;
      }

      const startTime = Date.now();
      const response = await axios.get(`${config.theOddsApi.host}/odds`, {
        params: {
          apiKey: config.theOddsApi.key,
          sport: 'basketball_nba',
          region: 'us',
        },
        timeout: 15000,
      });
      const latency = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(latency).toBeLessThan(10000); // Should respond within 10 seconds
    });

    it('should fetch live UFC odds', async () => {
      if (!config.theOddsApi.key) {
        console.warn('The Odds API key not configured, skipping test');
        return;
      }

      const response = await axios.get(`${config.theOddsApi.host}/odds`, {
        params: {
          apiKey: config.theOddsApi.key,
          sport: 'mma',
          region: 'us',
        },
        timeout: 15000,
      });

      expect(response.status).toBe(200);
    });

    it('should fetch live Soccer odds', async () => {
      if (!config.theOddsApi.key) {
        console.warn('The Odds API key not configured, skipping test');
        return;
      }

      const response = await axios.get(`${config.theOddsApi.host}/odds`, {
        params: {
          apiKey: config.theOddsApi.key,
          sport: 'soccer',
          region: 'us',
        },
        timeout: 15000,
      });

      expect(response.status).toBe(200);
    });
  });

  describe('News Feed', () => {
    it('should have news service imports', async () => {
      // Verify the news service file exists and can be imported
      const newsServicePath = './services/news-feed.service';
      try {
        const newsService = await import(newsServicePath);
        expect(newsService.newsFeedService).toBeDefined();
      } catch (error) {
        throw new Error('News service could not be imported');
      }
    });

    it('should have SEO components', async () => {
      const seoPath = './components/SEOHead';
      try {
        const seo = await import(seoPath);
        expect(seo.SEOHead).toBeDefined();
      } catch (error) {
        throw new Error('SEO component could not be imported');
      }
    });

    it('should have Schema.org markup component', async () => {
      const schemaPath = './components/SchemaMarkup';
      try {
        const schema = await import(schemaPath);
        expect(schema.SchemaMarkup).toBeDefined();
      } catch (error) {
        throw new Error('Schema markup component could not be imported');
      }
    });
  });

  describe('Cron Jobs', () => {
    it('should have cron job migration file', async () => {
      const fs = await import('fs');
      const cronPath = './supabase/migrations/004_cron_jobs.sql';
      expect(fs.existsSync(cronPath)).toBe(true);
    });

    it('should have sitemap generation function', async () => {
      const fs = await import('fs');
      const sitemapPath = './services/sitemap.service.ts';
      expect(fs.existsSync(sitemapPath)).toBe(true);
    });
  });
});

// Export for running tests
export default describe;
