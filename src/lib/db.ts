import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

export function getDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  return raw || null;
}

function createDb(): Db {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return drizzle(neon(url), { schema });
}

// Proxy ensures neon() is never called at module evaluation time (build-safe)
export const db = new Proxy({} as Db, {
  get(_, key) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[key];
  },
});

export async function pingDatabase(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!getDatabaseUrl()) {
      return { ok: false, error: "DATABASE_URL is not set" };
    }
    const sql = neon(getDatabaseUrl()!);
    await sql`SELECT 1`;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
