#!/usr/bin/env node
/**
 * Apply idempotent schema patches to Neon (rooms + users columns).
 * Usage: DATABASE_URL=postgresql://... node scripts/migrate-db.mjs
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const steps = [
  ["questions_json", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS questions_json text`],
  ["prize_pool", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS prize_pool integer DEFAULT 0`],
  ["language", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS language text`],
  ["starter_code", () => sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS starter_code text`],
  ["last_seen_at", () => sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at timestamp`],
  ["coins default", () => sql`ALTER TABLE users ALTER COLUMN coins_balance SET DEFAULT 1000`],
  [
    "launch coin backfill",
    () => sql`
      UPDATE users u
      SET coins_balance = 1000
      WHERE u.coins_balance < 1000
        AND NOT EXISTS (
          SELECT 1
          FROM coin_transactions ct
          WHERE ct.user_id = u.id
            AND ct.reference = 'main_event_launch'
            AND ct.type = 'gifted'
        )
    `,
  ],
  ["prize_pool backfill", () => sql`UPDATE rooms SET prize_pool = 0 WHERE prize_pool IS NULL`],
  ["prize_pool default", () => sql`ALTER TABLE rooms ALTER COLUMN prize_pool SET DEFAULT 0`],
];

for (const [label, run] of steps) {
  console.log(`→ ${label}`);
  await run();
}

console.log("✓ Database schema is up to date");
