import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

function createDb(): Db {
  return drizzle(neon(process.env.DATABASE_URL!), { schema });
}

// Proxy ensures neon() is never called at module evaluation time (build-safe)
export const db = new Proxy({} as Db, {
  get(_, key) {
    if (!_db) _db = createDb();
    return (_db as unknown as Record<string | symbol, unknown>)[key];
  },
});
