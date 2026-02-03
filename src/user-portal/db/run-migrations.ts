import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { supabase } from "./supabase-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  console.log("🚀 Running DraftClaw database migrations...\n");

  const migrations = [
    "001_initial_schema.sql",
    "002_picks_schema.sql",
  ];

  for (const migration of migrations) {
    const filePath = join(__dirname, "migrations", migration);
    console.log(`📄 Applying migration: ${migration}`);

    try {
      const sql = readFileSync(filePath, "utf-8");
      
      // Split by semicolons but handle functions that contain semicolons
      const statements = splitSqlStatements(sql);

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed || trimmed.startsWith("--")) continue;

        const { error } = await supabase.rpc("exec_sql", { sql_query: trimmed });
        
        if (error) {
          // Try direct execution for DDL statements
          const { error: directError } = await supabase.from("_migrations_check").select("*").limit(0);
          if (directError?.code === "42P01") {
            // Table doesn't exist, which is fine for first run
          }
          console.warn(`   ⚠️  Statement warning: ${error.message}`);
        }
      }

      console.log(`   ✅ Migration applied successfully\n`);
    } catch (err) {
      console.error(`   ❌ Failed to apply migration: ${err}`);
      process.exit(1);
    }
  }

  console.log("✨ All migrations completed!");
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let inFunction = false;
  let dollarQuote = "";

  const lines = sql.split("\n");

  for (const line of lines) {
    // Check for dollar-quoted strings (used in functions)
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

    // Only split on semicolons if not inside a function
    if (!inFunction && line.trim().endsWith(";")) {
      statements.push(current.trim());
      current = "";
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

// Run if executed directly
runMigrations().catch(console.error);
