#!/usr/bin/env node
/**
 * One-time backfill: give every account without a main_event_launch grant
 * a 1,000-coin balance and ledger entry.
 *
 * Usage: DATABASE_URL=postgresql://... node scripts/backfill-starter-coins.mjs
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
config({ path: ".env" });

const STARTER_COINS = 1000;
const GRANT_REF = "main_event_launch";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const eligible = await sql`
  SELECT u.id, u.coins_balance
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1
    FROM coin_transactions ct
    WHERE ct.user_id = u.id
      AND ct.reference = ${GRANT_REF}
      AND ct.type = 'gifted'
  )
`;

console.log(`Found ${eligible.length} account(s) without a launch grant.`);

for (const row of eligible) {
  const previous = row.coins_balance ?? 0;
  const nextBalance = Math.max(previous, STARTER_COINS);
  const grantAmount = STARTER_COINS;

  await sql`
    UPDATE users
    SET coins_balance = ${nextBalance}
    WHERE id = ${row.id}
  `;

  await sql`
    INSERT INTO coin_transactions (id, user_id, amount, type, reference)
    VALUES (${randomUUID()}, ${row.id}, ${grantAmount}, 'gifted', ${GRANT_REF})
  `;

  console.log(`→ ${row.id}: ${previous} → ${nextBalance} coins`);
}

console.log("✓ Starter coin backfill complete");
