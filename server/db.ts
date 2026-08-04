import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

// Lazy initialization — do NOT throw at module load time.
// Top-level imports of this file (e.g. in autoApply.ts, scraper/jobs.ts)
// should not crash the server if DATABASE_URL is absent; operations will
// throw naturally when actually called.

let _dbInstance: NodePgDatabase<typeof schema> | null = null;

function getDbInstance(): NodePgDatabase<typeof schema> {
  if (_dbInstance) return _dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set — database features are unavailable."
    );
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  _dbInstance = drizzle(pool, { schema });
  return _dbInstance;
}

// Proxy so callers use `db.select()` etc. unchanged — the real instance is
// only created (and DATABASE_URL checked) on the first actual DB call.
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDbInstance() as any)[prop];
  },
});
