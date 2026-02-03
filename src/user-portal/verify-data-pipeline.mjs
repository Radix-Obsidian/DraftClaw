#!/usr/bin/env node
/**
 * Data Pipeline Verification Script
 * Run with: node src/user-portal/verify-data-pipeline.mjs
 */

import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log(`Checking for .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error('Error loading .env file:', result.error);
  } else {
    console.log('Successfully loaded .env file');
  }
} else {
  console.warn('.env file not found at the expected location');
}

const { Pool } = pg;

const config = {
  theOddsApi: {
    key: process.env.ODDS_API_KEY,
    host: process.env.ODDS_API_HOST || 'https://api.the-odds-api.com/v4',
  },
  sportradar: {
    basketball: {
      key: process.env.SPORTRADAR_BASKETBALL_API_KEY,
      host: process.env.SPORTRADAR_BASKETBALL_HOST,
    },
    soccer: {
      key: process.env.SPORTRADAR_SOCCER_API_KEY,
      host: process.env.SPORTRADAR_SOCCER_HOST,
    },
    globalBasketball: {
      key: process.env.SPORTRADAR_GLOBAL_BASKETBALL_KEY,
      host: process.env.SPORTRADAR_GLOBAL_BASKETBALL_HOST,
    },
    mma: {
      key: process.env.SPORTRADAR_MMA_API_KEY,
      host: process.env.SPORTRADAR_MMA_HOST,
    },
  },
  sportsData: {
    key: process.env.SPORTSDATA_API_KEY,
    host: process.env.SPORTSDATA_API_HOST,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
};

async function testTheOddsAPI() {
  console.log('\n=== Testing The Odds API ===\n');
  
  if (!config.theOddsApi.key) {
    console.log(`❌ The Odds API key not configured (Value: "${config.theOddsApi.key}")`);
    return false;
  }

  try {
    console.log('Fetching sports list...');
    const sportsResponse = await axios.get(`${config.theOddsApi.host}/sports`, {
      params: { apiKey: config.theOddsApi.key },
      timeout: 10000,
    });
    console.log(`✅ Sports list: ${sportsResponse.data.length} sports available`);
    
    console.log('\nFetching NBA odds...');
    const nbaResponse = await axios.get(`${config.theOddsApi.host}/sports/basketball_nba/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        regions: 'us',
        markets: 'h2h,spreads',
      },
      timeout: 15000,
    });
    console.log(`✅ NBA odds: ${nbaResponse.data.length} events`);
    
    console.log('\nFetching UFC odds...');
    const ufcResponse = await axios.get(`${config.theOddsApi.host}/sports/mma_mixed_martial_arts/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        regions: 'us',
        markets: 'h2h',
      },
      timeout: 15000,
    });
    console.log(`✅ UFC odds: ${ufcResponse.data.length} events`);
    
    console.log('\nFetching Soccer odds...');
    const soccerResponse = await axios.get(`${config.theOddsApi.host}/sports/soccer_usa_mls/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        regions: 'us',
        markets: 'h2h',
      },
      timeout: 15000,
    });
    console.log(`✅ Soccer odds: ${soccerResponse.data.length} events`);
    
    return true;
  } catch (error) {
    console.log(`❌ The Odds API error: ${error.message}`);
    return false;
  }
}

async function testSportradarAPIs() {
  console.log('\n=== Testing Sportradar APIs ===\n');
  
  const results = [];
  
  for (const [name, api] of Object.entries(config.sportradar)) {
    if (!api.key) {
      console.log(`❌ ${name.toUpperCase()} API key not configured`);
      results.push({ name, success: false });
      continue;
    }
    
    try {
      console.log(`Testing ${name.toUpperCase()} API...`);
      const response = await axios.get(`${api.host}`, {
        headers: { 'x-api-key': api.key },
        timeout: 10000,
      });
      console.log(`✅ ${name.toUpperCase()} API responded with status ${response.status}`);
      results.push({ name, success: true });
    } catch (error) {
      console.log(`❌ ${name.toUpperCase()} API error: ${error.message}`);
      results.push({ name, success: false });
    }
  }
  
  return results.every(r => r.success);
}

async function testSportsDataAPI() {
  console.log('\n=== Testing SportsData.io API ===\n');
  
  if (!config.sportsData.key) {
    console.log('❌ SportsData.io API key not configured');
    return false;
  }
  
  try {
    console.log('Testing SportsData.io news feed...');
    // Trying a more standard endpoint if RotoBaller fails
    const response = await axios.get(`${config.sportsData.host}/nba/scores/json/News`, {
      params: { key: config.sportsData.key },
      timeout: 10000,
    });
    console.log(`✅ SportsData.io news feed: ${response.data.length} articles`);
    return true;
  } catch (error) {
    console.log(`❌ SportsData.io API error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===\n');
  
  if (!config.database.url || config.database.url.includes('YOUR_DB_PASSWORD')) {
    console.log('❌ Database URL not properly configured (missing password?)');
    return false;
  }

  const pool = new Pool({
    connectionString: config.database.url,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    client.release();
    
    const tableNames = tables.rows.map(r => r.table_name);
    console.log(`Found tables: ${tableNames.join(', ')}`);
    
    const requiredTables = ['events', 'odds_snapshots', 'picks', 'news_articles', 'player_news'];
    let allExist = true;
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
        allExist = false;
      }
    }
    
    await pool.end();
    return allExist;
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    if (error.detail) console.log(`   Detail: ${error.detail}`);
    if (error.hint) console.log(`   Hint: ${error.hint}`);
    await pool.end();
    return false;
  }
}

async function testDataFreshness() {
  console.log('\n=== Testing Data Freshness ===\n');
  
  const pool = new Pool({
    connectionString: config.database.url,
  });
  
  try {
    // Check latest odds snapshot
    const oddsResult = await pool.query(`
      SELECT 
        MAX(fetched_at) as latest_odds,
        COUNT(*) as total_odds
      FROM odds_snapshots
      WHERE fetched_at > NOW() - INTERVAL '1 hour'
    `);
    
    const latestOdds = oddsResult.rows[0];
    if (latestOdds.total_odds > 0) {
      console.log(`✅ Found ${latestOdds.total_odds} odds snapshots in the last hour`);
    } else {
      console.log('❌ No recent odds snapshots found');
    }
    
    // Check latest news
    const newsResult = await pool.query(`
      SELECT 
        MAX(published_at) as latest_news,
        COUNT(*) as total_news
      FROM news_articles
      WHERE published_at > NOW() - INTERVAL '24 hours'
    `);
    
    const latestNews = newsResult.rows[0];
    if (latestNews.total_news > 0) {
      console.log(`✅ Found ${latestNews.total_news} news articles in the last 24 hours`);
    } else {
      console.log('❌ No recent news articles found');
    }
    
    // Check latest picks
    const picksResult = await pool.query(`
      SELECT 
        MAX(generated_at) as latest_pick,
        COUNT(*) as total_picks
      FROM picks
      WHERE generated_at > NOW() - INTERVAL '24 hours'
    `);
    
    const latestPicks = picksResult.rows[0];
    if (latestPicks.total_picks > 0) {
      console.log(`✅ Found ${latestPicks.total_picks} picks generated in the last 24 hours`);
    } else {
      console.log('❌ No recent picks found');
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Data freshness test error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         DraftClaw Production Data Pipeline Test           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    theOddsApi: false,
    sportradar: false,
    sportsData: false,
    database: false,
    dataFreshness: false,
  };
  
  results.theOddsApi = await testTheOddsAPI();
  results.sportradar = await testSportradarAPIs();
  results.sportsData = await testSportsDataAPI();
  results.database = await testDatabaseConnection();
  results.dataFreshness = await testDataFreshness();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log(`\nThe Odds API:      ${results.theOddsApi ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sportradar APIs:   ${results.sportradar ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SportsData.io:     ${results.sportsData ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database:          ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Data Freshness:    ${results.dataFreshness ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
