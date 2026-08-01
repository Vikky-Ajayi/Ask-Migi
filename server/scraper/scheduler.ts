/**
 * Scraper scheduler — orchestrates events and job scrapers.
 *
 * Events: Meetup + Luma via BullMQ queue (falls back to inline p-limit if Redis down).
 *   Full sweep: every 6 hours
 *   Incremental: every 30 minutes
 *
 * Jobs: every 2 hours.
 * Cleanup: daily at 2am.
 */

import cron from "node-cron";
import {
  runFullEventSweep,
  runIncrementalEventSweep,
  expireOldEvents,
} from "./events";
import { runJobScrape, expireOldJobs } from "./jobs";

let schedulerStarted = false;

export function startScraperScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[scheduler] Starting scraper scheduler...");

  // ── Try starting BullMQ worker (if Redis is available) ───────────────────
  import("../queue/eventQueue.js")
    .then(({ startEventWorker }) => startEventWorker())
    .catch((err) =>
      console.warn("[scheduler] BullMQ worker not started:", err.message)
    );

  // ── Events incremental — every 30 minutes ─────────────────────────────────
  cron.schedule("*/30 * * * *", () => {
    console.log("[scheduler] Triggering event incremental sweep");
    runIncrementalEventSweep().catch((e) =>
      console.error("[scheduler] Incremental sweep error:", e)
    );
  });

  // ── Events full sweep — every 6 hours ─────────────────────────────────────
  cron.schedule("0 */6 * * *", () => {
    console.log("[scheduler] Triggering event full sweep");
    runFullEventSweep().catch((e) =>
      console.error("[scheduler] Full sweep error:", e)
    );
  });

  // ── Job scrape — every 2 hours ────────────────────────────────────────────
  cron.schedule("0 */2 * * *", () => {
    console.log("[scheduler] Triggering job scrape");
    runJobScrape().catch((e) =>
      console.error("[scheduler] Job scrape error:", e)
    );
  });

  // ── Cleanup — daily at 2am ────────────────────────────────────────────────
  cron.schedule("0 2 * * *", () => {
    console.log("[scheduler] Running daily cleanup");
    Promise.all([expireOldEvents(), expireOldJobs()]).catch((e) =>
      console.error("[scheduler] Cleanup error:", e)
    );
  });

  // ── Startup sequence (staggered so the server comes up first) ────────────
  // 1. Incremental event sweep 10s after boot
  setTimeout(() => {
    console.log("[scheduler] Running startup incremental event sweep...");
    runIncrementalEventSweep().catch(() => {});
  }, 10_000);

  // 2. Job scrape 25s after boot
  setTimeout(() => {
    console.log("[scheduler] Running startup job scrape...");
    runJobScrape().catch(() => {});
  }, 25_000);

  // 3. Full event sweep 90s after boot (long-running, runs in background)
  setTimeout(() => {
    console.log("[scheduler] Launching full event sweep in background...");
    runFullEventSweep().catch(() => {});
  }, 90_000);
}
