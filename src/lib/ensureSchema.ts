import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./db";

let schemaPromise: Promise<void> | null = null;

async function runSchemaStatements(): Promise<void> {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(url);

  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS questions_json text`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS prize_pool integer DEFAULT 0`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS language text`;
  await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS starter_code text`;
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS question_index integer DEFAULT 0`;
  await sql`UPDATE submissions SET question_index = 0 WHERE question_index IS NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp`;
  await sql`ALTER TABLE users ALTER COLUMN coins_balance SET DEFAULT 1000`;
  await sql`UPDATE rooms SET prize_pool = 0 WHERE prize_pool IS NULL`;
  await sql`ALTER TABLE rooms ALTER COLUMN prize_pool SET DEFAULT 0`;
}

/** Ensures Neon has columns required by the current app code. */
export async function ensureDatabaseSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = runSchemaStatements().catch((err) => {
      schemaPromise = null;
      throw err;
    });
  }
  await schemaPromise;
}
