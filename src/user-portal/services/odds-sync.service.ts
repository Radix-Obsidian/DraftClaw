import { Pool } from 'pg';
import { oddsApiService } from './odds-api.service';
import { logger } from '../utils/logger';

class OddsSyncService {
  private pool: Pool;
  private syncInterval: NodeJS.Timeout | null;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.syncInterval = null;
  }

  async start() {
    if (this.syncInterval) {
      return;
    }

    const interval = parseInt(process.env.ODDS_UPDATE_INTERVAL || '300000', 10);
    this.syncInterval = setInterval(() => this.syncOdds(), interval);
    
    // Initial sync
    await this.syncOdds();
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncOdds() {
    try {
      // Sync for each supported sport
      const sports = ['NBA', 'UFC', 'Soccer'];
      
      for (const sport of sports) {
        // Get events first
        const events = await oddsApiService.getEvents(sport);
        await this.syncEvents(events);

        // Then get odds for each event
        const odds = await oddsApiService.getOdds(sport);
        await this.syncOddsSnapshots(odds);
      }

      logger.info('Odds sync completed successfully');
    } catch (error) {
      logger.error('Error syncing odds:', error);
    }
  }

  private async syncEvents(events: any[]) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const event of events) {
        await client.query(
          `INSERT INTO events (
            sport, league, home_team, away_team, commence_time, 
            external_id, venue, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (external_id) 
          DO UPDATE SET
            home_team = EXCLUDED.home_team,
            away_team = EXCLUDED.away_team,
            commence_time = EXCLUDED.commence_time,
            venue = EXCLUDED.venue,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()`,
          [
            event.sport,
            event.league,
            event.home_team,
            event.away_team,
            event.commence_time,
            event.id,
            event.venue,
            event.metadata || {},
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async syncOddsSnapshots(oddsData: any[]) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const odds of oddsData) {
        const eventResult = await client.query(
          'SELECT id FROM events WHERE external_id = $1',
          [odds.event_id]
        );

        if (eventResult.rows.length === 0) {
          continue; // Skip if event doesn't exist
        }

        const eventId = eventResult.rows[0].id;

        await client.query(
          `INSERT INTO odds_snapshots (
            event_id, sportsbook, market_type, outcome,
            odds, line, fetched_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            eventId,
            odds.sportsbook,
            odds.market_type,
            odds.outcome,
            odds.odds,
            odds.line,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export const oddsSyncService = new OddsSyncService();
