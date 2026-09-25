/**
 * Run with: npm run db:init
 * Reads lib/schema.sql and executes each statement against the configured
 * Turso database. Safe to re-run (all statements use IF NOT EXISTS).
 */
import { readFileSync } from "fs";
import path from "path";
import { createClient } from "@libsql/client";

export async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("TURSO_DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  }

  const client = createClient({ url, authToken });

  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  const sql = readFileSync(schemaPath, "utf-8");

  // Split on semicolons that terminate a statement, ignoring empty chunks.
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    console.log(`Running: ${statement.slice(0, 60)}...`);
    await client.execute(statement);
  }

  console.log(`✅ Database initialized (${statements.length} statements executed).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Failed to initialize database:", err);
  process.exit(1);
});
