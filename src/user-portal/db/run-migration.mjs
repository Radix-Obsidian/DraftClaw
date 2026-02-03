#!/usr/bin/env node
/**
 * Migration Runner - Executes SQL migrations using Node.js pg client
 * Usage: node run-migration.mjs <migration-file>
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration(migrationFile) {
  const client = await pool.connect();
  
  try {
    console.log(`\n📦 Running migration: ${migrationFile}\n`);
    
    // Read migration file
    const migrationPath = resolve(__dirname, 'migrations', migrationFile);
    const sql = readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log(`✅ Migration completed successfully!\n`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Migration failed:`, error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get migration file from command line args
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Usage: node run-migration.mjs <migration-file>');
  console.error('Example: node run-migration.mjs 004_pick_expiration_cleanup.sql');
  process.exit(1);
}

runMigration(migrationFile);
