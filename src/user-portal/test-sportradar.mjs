#!/usr/bin/env node
/**
 * Sportradar API Test Script
 * Tests specific endpoints with proper authentication
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           Sportradar API Detailed Test                  ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const configs = [
  {
    name: 'NBA Basketball',
    host: process.env.SPORTRADAR_BASKETBALL_HOST,
    key: process.env.SPORTRADAR_BASKETBALL_API_KEY,
    endpoints: [
      '/v8/en/odds/external/odds.json',
      '/v8/en/games/2024/REG/schedule.json',
      '/v8/en/news/articles.json'
    ]
  },
  {
    name: 'Soccer',
    host: process.env.SPORTRADAR_SOCCER_HOST,
    key: process.env.SPORTRADAR_SOCCER_API_KEY,
    endpoints: [
      '/v4/en/competitions.json',
      '/v4/en/odds/external/odds.json',
      '/v4/en/news/articles.json'
    ]
  },
  {
    name: 'Global Basketball',
    host: process.env.SPORTRADAR_GLOBAL_BASKETBALL_HOST,
    key: process.env.SPORTRADAR_GLOBAL_BASKETBALL_KEY,
    endpoints: [
      '/v3/en/competitions.json',
      '/v3/en/schedule.json',
      '/v3/en/news/articles.json'
    ]
  },
  {
    name: 'MMA',
    host: process.env.SPORTRADAR_MMA_HOST,
    key: process.env.SPORTRADAR_MMA_API_KEY,
    endpoints: [
      '/v2/en/schedule.json',
      '/v2/en/odds/external/odds.json',
      '/v2/en/news/articles.json'
    ]
  }
];

async function testEndpoint(config, endpoint) {
  if (!config.key) {
    console.log(`   ❌ No API key configured`);
    return false;
  }

  try {
    console.log(`   Testing: ${endpoint}`);
    const response = await axios.get(`${config.host}${endpoint}`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': config.key
      },
      timeout: 10000
    });
    
    console.log(`   ✅ Status: ${response.status} | Size: ${JSON.stringify(response.data).length} bytes`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    if (error.response?.status === 403) {
      console.log(`      This might be a trial key limitation or incorrect endpoint`);
    }
    if (error.response?.status === 404) {
      console.log(`      Endpoint not found - check version number`);
    }
    return false;
  }
}

async function main() {
  let totalSuccess = 0;
  let totalTests = 0;

  for (const config of configs) {
    console.log(`\n=== ${config.name.toUpperCase()} ===`);
    console.log(`Host: ${config.host}`);
    console.log(`Key: ${config.key ? `${config.key.substring(0, 8)}...` : 'NOT CONFIGURED'}`);
    
    for (const endpoint of config.endpoints) {
      totalTests++;
      if (await testEndpoint(config, endpoint)) {
        totalSuccess++;
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      Summary                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nSportradar Tests: ${totalSuccess}/${totalTests} passed`);
  
  if (totalSuccess === 0) {
    console.log('\n💡 Suggestions:');
    console.log('1. Check if your Sportradar trial account is activated');
    console.log('2. Verify API keys in your Sportradar dashboard');
    console.log('3. Some endpoints may require paid access');
    console.log('4. Trial accounts might have limited endpoint access');
  }
}

main().catch(console.error);
