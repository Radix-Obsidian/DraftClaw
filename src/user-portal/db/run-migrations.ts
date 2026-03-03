import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  "001_initial_schema.sql",
  "002_sports_data_schema.sql",
  "003_news_and_optimization.sql",
  "004_pick_expiration_cleanup.sql",
  "005_picks_compat.sql",
  "006_goat_tier_fix.sql",
  "007_admin_rbac.sql",
];

async function runMigrations() {
  console.log("Running DraftClaw database migrations...\n");

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of migrations) {
      const { rows } = await client.query("SELECT 1 FROM _migrations WHERE name = $1", [migration]);
      if (rows.length > 0) {
        console.log(`  Skipping (already applied): ${migration}`);
        continue;
      }

      const filePath = join(__dirname, "migrations", migration);
      console.log(`  Applying: ${migration}`);

      try {
        const sql = readFileSync(filePath, "utf-8");
        const statements = splitSqlStatements(sql);

        await client.query("BEGIN");
        for (const statement of statements) {
          const trimmed = statement.trim();
          if (!trimmed || trimmed.startsWith("--")) continue;
          await client.query(trimmed);
        }
        await client.query("INSERT INTO _migrations(name, applied_at) VALUES ($1, NOW())", [migration]);
        await client.query("COMMIT");
        console.log(`  Applied successfully\n`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  FAILED: ${migration}: ${err}`);
        process.exit(1);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log("All migrations completed!");
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inFunction = false;
  let dollarQuote = "";

  for (const line of sql.split("\n")) {
    const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/);
    if (dollarMatch) {
      if (!inFunction) {
        inFunction = true;
        dollarQuote = dollarMatch[0];
      } else if (line.includes(dollarQuote) && current.includes(dollarQuote)) {
        inFunction = false;
        dollarQuote = "";
      }
    }
    current += line + "\n";
    if (!inFunction && line.trim().endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

runMigrations().catch(console.error);
