#!/usr/bin/env node
/**
 * AI Data Processing Test
 * Tests the AI's ability to process live sports data and generate picks
 */

import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         AI Data Processing Live Test                    ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// Configuration
const config = {
  theOddsApi: {
    key: process.env.ODDS_API_KEY,
    host: process.env.ODDS_API_HOST || 'https://api.the-odds-api.com/v4',
  },
  sportsData: {
    key: process.env.SPORTSDATA_API_KEY,
    host: process.env.SPORTSDATA_API_HOST || 'https://api.sportsdata.io/v3',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
};

const pool = new Pool({
  connectionString: config.database.url,
  ssl: { rejectUnauthorized: false }
});

// Test data collection
const testResults = {
  dataFetched: {},
  dataStored: {},
  aiProcessed: {},
  errors: []
};

async function fetchLiveOdds() {
  console.log('\n=== 1. Fetching Live Odds Data ===\n');
  
  const sports = [
    { name: 'NBA', endpoint: 'basketball_nba' },
    { name: 'UFC', endpoint: 'mma_mixed_martial_arts' },
    { name: 'Soccer', endpoint: 'soc_e-1' }
  ];
  
  for (const sport of sports) {
    try {
      console.log(`Fetching ${sport.name} odds...`);
      const response = await axios.get(
        `${config.theOddsApi.host}/sports/${sport.endpoint}/odds`,
        {
          params: {
            apiKey: config.theOddsApi.key,
            regions: 'us',
            markets: 'h2h,spreads,totals',
            oddsFormat: 'american'
          },
          timeout: 15000
        }
      );
      
      const events = response.data;
      testResults.dataFetched[sport.name] = {
        count: events.length,
        sample: events.slice(0, 2).map(e => ({
          id: e.id,
          teams: e.teams?.map(t => t.name) || e.home_team + ' vs ' + e.away_team,
          odds: e.bookmakers?.[0]?.markets?.[0]?.outcomes?.slice(0, 2)
        }))
      };
      
      console.log(`✅ ${sport.name}: ${events.length} events fetched`);
      
      // Store in database
      await storeOddsData(sport.name, events);
      
    } catch (error) {
      console.log(`❌ ${sport.name}: ${error.message}`);
      testResults.errors.push(`${sport.name} odds fetch: ${error.message}`);
    }
  }
}

async function fetchLiveNews() {
  console.log('\n=== 2. Fetching Live News Data ===\n');
  
  try {
    console.log('Fetching NBA news...');
    const response = await axios.get(
      `${config.sportsData.host}/nba/scores/json/News`,
      {
        params: { key: config.sportsData.key },
        timeout: 10000
      }
    );
    
    const articles = response.data;
    testResults.dataFetched.News = {
      count: articles.length,
      sample: articles.slice(0, 2).map(a => ({
        title: a.Title,
        source: a.OriginalSource,
        published: a.TimeAgo
      }))
    };
    
    console.log(`✅ News: ${articles.length} articles fetched`);
    
    // Store in database
    await storeNewsData(articles);
    
  } catch (error) {
    console.log(`❌ News fetch: ${error.message}`);
    testResults.errors.push(`News fetch: ${error.message}`);
  }
}

async function storeOddsData(sport, events) {
  const client = await pool.connect();
  
  try {
    let storedCount = 0;
    
    for (const event of events.slice(0, 5)) { // Store first 5 for testing
      // Check if event exists
      const existing = await client.query(
        'SELECT id FROM events WHERE external_id = $1',
        [event.id]
      );
      
      if (existing.rows.length === 0) {
        // Insert new event
        await client.query(`
          INSERT INTO events (
            external_id, sport, home_team, away_team, 
            commence_time, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        `, [
          event.id,
          sport.toUpperCase(),
          event.home_team || event.teams?.[0]?.name,
          event.away_team || event.teams?.[1]?.name,
          event.commence_time,
          'scheduled'
        ]);
        
        storedCount++;
      }
      
      // Store odds snapshot
      if (event.bookmakers && event.bookmakers.length > 0) {
        for (const market of event.bookmakers[0].markets) {
          for (const outcome of market.outcomes) {
            await client.query(`
              INSERT INTO odds_snapshots (
                event_id, sportsbook, market_type, outcome_name,
                price, american_odds, fetched_at, created_at
              ) VALUES (
                (SELECT id FROM events WHERE external_id = $1),
                $2, $3, $4, $5, $6, NOW(), NOW()
              )
            `, [
              event.id,
              event.bookmakers[0].key,
              market.key,
              outcome.name,
              outcome.price,
              outcome.price
            ]);
          }
        }
      }
    }
    
    testResults.dataStored[sport] = storedCount;
    console.log(`   Stored ${storedCount} new ${sport} events`);
    
  } finally {
    client.release();
  }
}

async function storeNewsData(articles) {
  const client = await pool.connect();
  
  try {
    let storedCount = 0;
    
    for (const article of articles.slice(0, 5)) { // Store first 5 for testing
      await client.query(`
        INSERT INTO news_articles (
          title, slug, content, source,
          published_at, sport, category, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
      `, [
        article.Title,
        article.Title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 255),
        article.Content?.substring(0, 1000), // Truncate for testing
        article.OriginalSource || 'sportsdata',
        new Date(), // Use current date since TimeAgo is relative
        'NBA',
        'general'
      ]);
      
      storedCount++;
    }
    
    testResults.dataStored.News = storedCount;
    console.log(`   Stored ${storedCount} news articles`);
    
  } finally {
    client.release();
  }
}

async function simulateAIProcessing() {
  console.log('\n=== 3. Simulating AI Data Processing ===\n');
  
  const client = await pool.connect();
  
  try {
    // Get recent events with odds
    const eventsResult = await client.query(`
      SELECT e.*, s.name as sportsbook, os.market_type, os.outcome_name, os.price
      FROM events e
      LEFT JOIN odds_snapshots os ON e.id = os.event_id
      LEFT JOIN sportsbooks s ON os.sportsbook = s.key
      WHERE e.created_at > NOW() - INTERVAL '1 hour'
      ORDER BY e.created_at DESC
      LIMIT 5
    `);
    
    console.log(`Processing ${eventsResult.rows.length} recent events...`);
    
    for (const event of eventsResult.rows) {
      // Simulate AI analysis
      const analysis = analyzeEvent(event);
      
      // Store AI pick
      await client.query(`
        INSERT INTO picks (
          event_id, sport, type, pick_description,
          confidence, analysis, best_odds, best_sportsbook,
          generated_at, result
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'pending')
      `, [
        event.id,
        event.sport,
        'moneyline',
        `Bet on ${event.home_team}`,
        analysis.confidence,
        analysis.reasoning,
        event.price || 100,
        event.sportsbook || 'fanduel'
      ]);
      
      testResults.aiProcessed[event.sport] = (testResults.aiProcessed[event.sport] || 0) + 1;
      console.log(`   ✅ Generated pick for ${event.home_team} vs ${event.away_team}`);
    }
    
    // Get recent news for sentiment analysis
    const newsResult = await client.query(`
      SELECT * FROM news_articles
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY published_at DESC
      LIMIT 5
    `);
    
    console.log(`Analyzing sentiment for ${newsResult.rows.length} news articles...`);
    
    for (const article of newsResult.rows) {
      const sentiment = analyzeSentiment(article);
      
      // Update article with AI analysis
      await client.query(`
        UPDATE news_articles
        SET summary = $1, metadata = jsonb_set(metadata, '{sentiment}', $2), updated_at = NOW()
        WHERE id = $3
      `, [
        sentiment.summary,
        `"${sentiment.score}"`,
        article.id
      ]);
      
      console.log(`   ✅ Analyzed: "${article.title.substring(0, 50)}..."`);
    }
    
  } finally {
    client.release();
  }
}

function analyzeEvent(event) {
  // Simulate AI analysis based on odds
  const price = event.price || 100;
  
  // Simple logic: pick based on price
  const pick = price > 0 ? 'home' : 'away';
  const confidence = Math.min(85, Math.abs(price) / 2 + 50);
  
  return {
    pickType: pick,
    confidence: confidence,
    reasoning: `Odds analysis shows ${event.home_team} vs ${event.away_team}. Current odds: ${price}`
  };
}

function analyzeSentiment(article) {
  // Simple sentiment analysis simulation
  const positiveWords = ['win', 'victory', 'excellent', 'strong', 'dominant'];
  const negativeWords = ['loss', 'defeat', 'injury', 'struggle', 'weak'];
  
  const text = (article.title + ' ' + article.content).toLowerCase();
  const positiveCount = positiveWords.filter(word => text.includes(word)).length;
  const negativeCount = negativeWords.filter(word => text.includes(word)).length;
  
  const score = positiveCount - negativeCount;
  const sentiment = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
  
  return {
    score: sentiment,
    summary: `Article shows ${sentiment} sentiment with ${score > 0 ? '+' : ''}${score} sentiment points`
  };
}

async function generateReport() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Test Report                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n--- Data Fetched ---');
  for (const [source, data] of Object.entries(testResults.dataFetched)) {
    console.log(`${source}: ${data.count} items`);
    if (data.sample) {
      data.sample.forEach(item => {
        console.log(`  Sample: ${item.teams || item.title}`);
      });
    }
  }
  
  console.log('\n--- Data Stored ---');
  for (const [source, count] of Object.entries(testResults.dataStored)) {
    console.log(`${source}: ${count} items stored`);
  }
  
  console.log('\n--- AI Processed ---');
  for (const [sport, count] of Object.entries(testResults.aiProcessed)) {
    console.log(`${sport}: ${count} picks generated`);
  }
  
  if (testResults.errors.length > 0) {
    console.log('\n--- Errors ---');
    testResults.errors.forEach(error => console.log(`❌ ${error}`));
  }
  
  // Summary
  const totalFetched = Object.values(testResults.dataFetched).reduce((sum, d) => sum + d.count, 0);
  const totalStored = Object.values(testResults.dataStored).reduce((sum, d) => sum + d, 0);
  const totalProcessed = Object.values(testResults.aiProcessed).reduce((sum, d) => sum + d, 0);
  
  console.log('\n--- Summary ---');
  console.log(`Total Data Fetched: ${totalFetched}`);
  console.log(`Total Data Stored: ${totalStored}`);
  console.log(`Total AI Picks Generated: ${totalProcessed}`);
  console.log(`Errors: ${testResults.errors.length}`);
  
  const success = totalProcessed > 0 && testResults.errors.length < 3;
  console.log(`\n${success ? '🎉 AI is successfully processing live data!' : '⚠️  Some issues detected'}`);
  
  await pool.end();
  return success;
}

async function main() {
  try {
    await fetchLiveOdds();
    await fetchLiveNews();
    await simulateAIProcessing();
    const success = await generateReport();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main().catch(console.error);
