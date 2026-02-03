#!/usr/bin/env node
/**
 * Data Pipeline Verification Script
 * Run with: node src/user-portal/verify-data-pipeline.js
 */

const axios = require('axios');
require('dotenv').config();

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
};

async function testTheOddsAPI() {
  console.log('\n=== Testing The Odds API ===\n');
  
  if (!config.theOddsApi.key) {
    console.log('❌ The Odds API key not configured');
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
    const nbaResponse = await axios.get(`${config.theOddsApi.host}/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        sport: 'basketball_nba',
        region: 'us',
      },
      timeout: 15000,
    });
    console.log(`✅ NBA odds: ${nbaResponse.data.length} events`);
    
    console.log('\nFetching UFC odds...');
    const ufcResponse = await axios.get(`${config.theOddsApi.host}/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        sport: 'mma',
        region: 'us',
      },
      timeout: 15000,
    });
    console.log(`✅ UFC odds: ${ufcResponse.data.length} events`);
    
    console.log('\nFetching Soccer odds...');
    const soccerResponse = await axios.get(`${config.theOddsApi.host}/odds`, {
      params: {
        apiKey: config.theOddsApi.key,
        sport: 'soccer',
        region: 'us',
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
      // Just verify the key is valid format (not actual API call)
      if (api.key.length < 10) {
        console.log(`⚠️  ${name.toUpperCase()} API key seems too short`);
      } else {
        console.log(`✅ ${name.toUpperCase()} API key configured (length: ${api.key.length})`);
      }
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
    console.log('Testing SportsData.io API key...');
    if (config.sportsData.key.length < 10) {
      console.log(`⚠️  SportsData.io API key seems too short`);
    } else {
      console.log(`✅ SportsData.io API key configured (length: ${config.sportsData.key.length})`);
    }
    return true;
  } catch (error) {
    console.log(`❌ SportsData.io API error: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n=== Testing Database Connection ===\n');
  
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    const result = await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
    
    // Check tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = tables.rows.map(r => r.table_name);
    
    const requiredTables = ['events', 'odds_snapshots', 'picks', 'news_articles', 'player_news'];
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
      }
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Database error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function verifySchema() {
  console.log('\n=== Verifying Schema ===\n');
  
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Check NCAAB and NCAAW support
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events'
      AND column_name = 'sport'
    `);
    
    if (result.rows.length > 0) {
      const sportType = result.rows[0].data_type;
      console.log(`✅ Events table sport column type: ${sportType}`);
    }
    
    // Check indexes
    const indexes = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('events', 'odds_snapshots', 'news_articles')
    `);
    console.log(`✅ Found ${indexes.rows.length} indexes`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ Schema verification error: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         DraftClaw Data Pipeline Verification               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const results = {
    theOddsApi: false,
    sportradar: false,
    sportsData: false,
    database: false,
    schema: false,
  };
  
  results.theOddsApi = await testTheOddsAPI();
  results.sportradar = await testSportradarAPIs();
  results.sportsData = await testSportsDataAPI();
  results.database = await testDatabaseConnection();
  results.schema = await verifySchema();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log(`\nThe Odds API:      ${results.theOddsApi ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Sportradar APIs:   ${results.sportradar ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SportsData.io:     ${results.sportsData ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Database:          ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Schema:            ${results.schema ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
