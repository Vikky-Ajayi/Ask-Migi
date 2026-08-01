/**
 * Shared Redis connection for BullMQ.
 * Uses REDIS_URL env var (set in Replit Secrets).
 */

import { Redis } from "ioredis";

let _conn: Redis | null = null;

export function getRedisConnection(): Redis {
  if (_conn) return _conn;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("[redis] REDIS_URL is not set. Add it to Replit Secrets.");
  }

  _conn = new Redis(url, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
    retryStrategy: (times) => {
      // Stop retrying after 5 attempts — the fallback p-limit sweep will handle things
      if (times > 5) return null as unknown as number;
      return Math.min(times * 2000, 15000);
    },
  });

  let _redisOk = false;
  _conn.on("error", (err) => {
    if (!_redisOk) console.warn("[redis] Not available:", err.message.split("\n")[0]);
  });
  _conn.on("connect", () => { _redisOk = true; console.log("[redis] Connected"); });

  return _conn;
}
