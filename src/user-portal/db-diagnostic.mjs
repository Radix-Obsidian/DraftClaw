#!/usr/bin/env node
/**
 * Database Connection Diagnostic
 * Run with: node src/user-portal/db-diagnostic.mjs
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log(`Checking for .env at: ${envPath}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Loaded .env file');
} else {
  console.error('❌ .env file not found');
  process.exit(1);
}

const { Pool } = pg;

// Parse the connection string to debug
const dbUrl = process.env.DATABASE_URL;
console.log('\n=== Database Connection Diagnostics ===\n');

if (!dbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

// Show connection string (mask password)
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
console.log(`Connection string: ${maskedUrl}`);

// Try different connection configurations
const configs = [
  {
    name: 'Default SSL (rejectUnauthorized: false)',
    config: {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    }
  },
  {
    name: 'No SSL',
    config: {
      connectionString: dbUrl,
      ssl: false
    }
  },
  {
    name: 'SSL require',
    config: {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false, require: true }
    }
  }
];

async function testConnection(name, config) {
  console.log(`\n--- Testing: ${name} ---`);
  const pool = new Pool(config);
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log(`✅ SUCCESS: ${result.rows[0].version}`);
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    if (error.code) console.log(`   Code: ${error.code}`);
    if (error.detail) console.log(`   Detail: ${error.detail}`);
    await pool.end();
    return false;
  }
}

async function main() {
  console.log('\nTesting different SSL configurations...\n');
  
  let success = false;
  for (const { name, config } of configs) {
    if (await testConnection(name, config)) {
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ All connection attempts failed');
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify the password is correct in Supabase Dashboard');
    console.log('2. Check if the database user exists: postgres.xqeyzuetksfqslsxhmpc');
    console.log('3. Try using the direct connection string from Supabase instead of pooler');
    console.log('4. Ensure your IP is allowed in Supabase Database > IPv4');
    process.exit(1);
  }
  
  console.log('\n✅ Database connection working!');
}

main().catch(console.error);
