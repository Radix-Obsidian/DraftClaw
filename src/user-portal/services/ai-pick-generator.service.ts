import { pool } from '../db/pool.js';
import { logger } from '../utils/logger';

interface OddsAnalysis {
  eventId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  sharpLine: number | null;
  retailLine: number | null;
  edge: number;
  bestOdds: number;
  bestSportsbook: string;
  marketType: string;
  recommendation: 'home' | 'away' | 'over' | 'under' | null;
}

interface NewsImpact {
  sentiment: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  relevantNews: string[];
}

export class AIPickGeneratorService {
  private syncInterval: NodeJS.Timeout | null;
  private isGenerating: boolean;

  constructor() {
    this.syncInterval = null;
    this.isGenerating = false;
  }

  async start() {
    if (this.syncInterval) {
      return;
    }

    const interval = parseInt(process.env.PICK_GENERATION_INTERVAL || '1800000', 10); // 30 minutes
    
    // Initial generation after 30 seconds (let odds/news sync first)
    setTimeout(() => this.generatePicks(), 30000);
    
    this.syncInterval = setInterval(() => this.generatePicks(), interval);
    logger.info('AI Pick Generator service started');
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('AI Pick Generator service stopped');
  }

  async generatePicks(): Promise<void> {
    if (this.isGenerating) {
      logger.info('Pick generation already in progress, skipping...');
      return;
    }

    this.isGenerating = true;
    const client = await pool.connect();

    try {
      logger.info('Starting AI pick generation...');

      // Get upcoming events with odds (next 48 hours)
      const eventsResult = await client.query(`
        SELECT DISTINCT ON (e.id)
          e.id,
          e.sport,
          e.home_team,
          e.away_team,
          e.commence_time,
          e.league
        FROM events e
        WHERE e.status = 'scheduled'
          AND e.commence_time > NOW()
          AND e.commence_time < NOW() + INTERVAL '48 hours'
        ORDER BY e.id, e.commence_time
      `);

      logger.info(`Found ${eventsResult.rows.length} upcoming events`);

      let picksGenerated = 0;
      let picksSkipped = 0;

      for (const event of eventsResult.rows) {
        // Check if we already have an active pick for this event
        const existingPick = await client.query(
          'SELECT id FROM picks WHERE event_id = $1 AND is_active = true',
          [event.id]
        );

        if (existingPick.rows.length > 0) {
          picksSkipped++;
          continue;
        }

        // Analyze odds for this event
        const oddsAnalysis = await this.analyzeEventOdds(client, event.id);
        
        if (!oddsAnalysis || oddsAnalysis.edge < 3) {
          // Skip events with insufficient edge
          continue;
        }

        // Get news impact
        const newsImpact = await this.analyzeNewsImpact(client, event.sport, event.home_team, event.away_team);

        // Generate pick
        const pick = this.generatePickFromAnalysis(event, oddsAnalysis, newsImpact);

        if (pick.confidence >= 40) {
          // Store pick in database
          await client.query(`
            INSERT INTO picks (
              event_id, sport, type, pick_description,
              analysis, confidence, expected_value,
              recommended_units, best_odds, best_sportsbook,
              sharp_line, retail_line, edge_percentage,
              is_active, is_featured, result,
              generated_at, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), $17)
          `, [
            event.id,
            event.sport,
            pick.type,
            pick.description,
            pick.analysis,
            pick.confidence,
            pick.expectedValue,
            pick.recommendedUnits,
            oddsAnalysis.bestOdds,
            oddsAnalysis.bestSportsbook,
            oddsAnalysis.sharpLine,
            oddsAnalysis.retailLine,
            oddsAnalysis.edge,
            true,
            pick.confidence >= 75, // Featured if high confidence
            'pending',
            new Date(event.commence_time).getTime() - (60 * 60 * 1000) // Expires 1 hour before game
          ]);

          picksGenerated++;
          logger.info(`Generated pick: ${pick.description}`);
        }
      }

      // Deactivate expired picks
      await this.deactivateExpiredPicks(client);

      logger.info(`Pick generation complete: ${picksGenerated} generated, ${picksSkipped} skipped`);
    } catch (error) {
      logger.error('Error generating picks:', error);
    } finally {
      client.release();
      this.isGenerating = false;
    }
  }

  private async analyzeEventOdds(client: any, eventId: string): Promise<OddsAnalysis | null> {
    // Get latest odds from sharp and retail books
    const oddsResult = await client.query(`
      SELECT 
        os.sportsbook,
        os.market_type,
        os.outcome_name,
        os.price,
        os.american_odds,
        os.point,
        sb.is_sharp,
        os.fetched_at
      FROM odds_snapshots os
      JOIN sportsbooks sb ON os.sportsbook = sb.key
      WHERE os.event_id = $1
        AND os.fetched_at > NOW() - INTERVAL '2 hours'
      ORDER BY os.fetched_at DESC
    `, [eventId]);

    if (oddsResult.rows.length === 0) {
      return null;
    }

    const eventResult = await client.query(
      'SELECT sport, home_team, away_team, commence_time FROM events WHERE id = $1',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return null;
    }

    const event = eventResult.rows[0];
    const odds = oddsResult.rows;

    // Find sharp line (Pinnacle, Circa)
    const sharpOdds = odds.filter(o => o.is_sharp);
    const retailOdds = odds.filter(o => !o.is_sharp);

    if (sharpOdds.length === 0 || retailOdds.length === 0) {
      return null;
    }

    // Calculate average sharp and retail lines for moneyline
    const sharpMoneyline = sharpOdds.filter(o => o.market_type === 'h2h');
    const retailMoneyline = retailOdds.filter(o => o.market_type === 'h2h');

    if (sharpMoneyline.length === 0 || retailMoneyline.length === 0) {
      return null;
    }

    const avgSharpLine = sharpMoneyline.reduce((sum, o) => sum + (o.american_odds || 0), 0) / sharpMoneyline.length;
    const avgRetailLine = retailMoneyline.reduce((sum, o) => sum + (o.american_odds || 0), 0) / retailMoneyline.length;

    // EV calculation using vig-removed sharp probs (ported from extensions/draft-claw/src/analysis.ts)
    const sharpOutcomes = sharpMoneyline.map((o: any) => ({ odds: o.american_odds || -110 }));
    const decimalOdds = sharpOutcomes.map((o: any) => o.odds > 0 ? o.odds / 100 + 1 : 100 / Math.abs(o.odds) + 1);
    const totalImplied = decimalOdds.reduce((s: number, d: number) => s + 1 / d, 0);
    const trueProb = totalImplied > 0 ? (1 / decimalOdds[0]) / totalImplied : 0.5;
    const retailDecimal = avgRetailLine > 0 ? avgRetailLine / 100 + 1 : 100 / Math.abs(avgRetailLine) + 1;
    const evPct = (retailDecimal * trueProb - 1) * 100;
    const edge = Math.max(0, evPct);

    // Find best odds
    const bestOddsEntry = retailMoneyline.reduce((best, current) => {
      return Math.abs(current.american_odds || 0) > Math.abs(best.american_odds || 0) ? current : best;
    });

    return {
      eventId,
      sport: event.sport,
      homeTeam: event.home_team,
      awayTeam: event.away_team,
      commenceTime: event.commence_time,
      sharpLine: avgSharpLine,
      retailLine: avgRetailLine,
      edge,
      bestOdds: bestOddsEntry.american_odds || 0,
      bestSportsbook: bestOddsEntry.sportsbook,
      marketType: 'h2h',
      recommendation: avgSharpLine < avgRetailLine ? 'home' : 'away'
    };
  }

  private async analyzeNewsImpact(client: any, sport: string, homeTeam: string, awayTeam: string): Promise<NewsImpact> {
    // Get recent news mentioning these teams
    const newsResult = await client.query(`
      SELECT title, content, summary, published_at
      FROM news_articles
      WHERE sport = $1
        AND (
          title ILIKE $2 OR title ILIKE $3 OR
          content ILIKE $2 OR content ILIKE $3
        )
        AND published_at > NOW() - INTERVAL '7 days'
      ORDER BY published_at DESC
      LIMIT 10
    `, [sport, `%${homeTeam}%`, `%${awayTeam}%`]);

    if (newsResult.rows.length === 0) {
      return { sentiment: 'neutral', impactScore: 0, relevantNews: [] };
    }

    // Simple sentiment analysis
    const positiveWords = ['win', 'victory', 'excellent', 'strong', 'dominant', 'healthy', 'return', 'hot', 'streak'];
    const negativeWords = ['loss', 'defeat', 'injury', 'struggle', 'weak', 'out', 'questionable', 'doubtful', 'suspended'];

    let positiveCount = 0;
    let negativeCount = 0;
    const relevantNews: string[] = [];

    for (const article of newsResult.rows) {
      const text = (article.title + ' ' + (article.content || article.summary || '')).toLowerCase();
      
      positiveCount += positiveWords.filter(word => text.includes(word)).length;
      negativeCount += negativeWords.filter(word => text.includes(word)).length;
      
      relevantNews.push(article.title);
    }

    const sentimentScore = positiveCount - negativeCount;
    const sentiment = sentimentScore > 2 ? 'positive' : sentimentScore < -2 ? 'negative' : 'neutral';
    const impactScore = Math.min(Math.abs(sentimentScore) * 2, 10);

    return { sentiment, impactScore, relevantNews: relevantNews.slice(0, 3) };
  }

  private generatePickFromAnalysis(event: any, odds: OddsAnalysis, news: NewsImpact): any {
    // Calculate confidence based on edge and news impact
    let baseConfidence = Math.min(odds.edge * 5, 85);
    
    // Adjust for news sentiment
    if (news.sentiment === 'positive') {
      baseConfidence += news.impactScore / 2;
    } else if (news.sentiment === 'negative') {
      baseConfidence -= news.impactScore / 2;
    }

    const confidence = Math.max(30, Math.min(95, baseConfidence));

    // Determine pick type
    let type: 'moneyline' | 'spread' | 'total';
    if (confidence >= 75) {
      type = 'moneyline'; // Lock
    } else if (confidence >= 55) {
      type = 'spread';
    } else {
      type = 'total'; // Longshot
    }

    // Generate description
    const team = odds.recommendation === 'home' ? odds.homeTeam : odds.awayTeam;
    const description = `${team} ${odds.bestOdds > 0 ? '+' : ''}${odds.bestOdds}`;

    // Generate analysis
    const analysis = this.generateAnalysisText(event, odds, news, confidence);

    // Calculate expected value and units
    const impliedProbability = this.oddsToImpliedProbability(odds.bestOdds);
    const expectedValue = ((confidence / 100) - impliedProbability) * 100;
    const recommendedUnits = confidence >= 75 ? 3 : confidence >= 60 ? 2 : 1;

    return {
      type: confidence >= 75 ? 'lock' : confidence >= 55 ? 'longshot' : 'trap',
      description,
      analysis,
      confidence,
      expectedValue,
      recommendedUnits
    };
  }

  private generateAnalysisText(event: any, odds: OddsAnalysis, news: NewsImpact, confidence: number): string {
    const parts: string[] = [];

    // Edge analysis
    parts.push(`Sharp money shows a ${odds.edge.toFixed(1)}% edge on this matchup.`);

    // Line movement
    if (odds.sharpLine && odds.retailLine) {
      const diff = Math.abs(odds.retailLine - odds.sharpLine);
      if (diff > 10) {
        parts.push(`Significant line movement detected - retail books are ${diff.toFixed(0)} points off sharp consensus.`);
      }
    }

    // News impact
    if (news.impactScore > 5) {
      parts.push(`Recent news shows ${news.sentiment} sentiment with impact score of ${news.impactScore.toFixed(1)}.`);
      if (news.relevantNews.length > 0) {
        parts.push(`Key headlines: "${news.relevantNews[0]}"`);
      }
    }

    // Confidence summary
    if (confidence >= 75) {
      parts.push('High confidence play - lock it in.');
    } else if (confidence >= 60) {
      parts.push('Solid value here with good edge.');
    } else {
      parts.push('Longshot play - manage your risk accordingly.');
    }

    return parts.join(' ');
  }

  private oddsToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  private async deactivateExpiredPicks(client: any): Promise<void> {
    await client.query(`
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
        )
    `);
  }

  async generatePicksOnDemand(): Promise<number> {
    await this.generatePicks();
    
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) FROM picks WHERE is_active = true AND generated_at > NOW() - INTERVAL \'5 minutes\''
      );
      return parseInt(result.rows[0].count);
    } finally {
      client.release();
    }
  }
}

export const aiPickGeneratorService = new AIPickGeneratorService();
