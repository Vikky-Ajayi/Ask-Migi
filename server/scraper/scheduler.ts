/**
 * Scraper scheduler — orchestrates Eventbrite and job scrapers.
 *
 * Full Eventbrite sweep: 450+ locations × 20 categories × 4 date windows
 * = ~36,000 parallel work units processed 15 at a time. Runs every 6h in
 * background (never awaited — Express keeps serving while it runs).
 *
 * Incremental sweep: keyword-only, 8 concurrent workers, every 30 min.
 * Job scrape: every 2 hours.
 * Cleanup: daily at 2am.
 */

import cron from "node-cron";
import {
  runFullEventbriteSweep,
  runIncrementalEventbriteSweep,
  expireOldEvents,
} from "./eventbrite";
import { runJobScrape, expireOldJobs } from "./jobs";

let schedulerStarted = false;

export function startScraperScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[scheduler] Starting scraper scheduler...");

  // ── Eventbrite incremental — every 30 minutes ─────────────────────────────
  cron.schedule("*/30 * * * *", () => {
    console.log("[scheduler] Triggering Eventbrite incremental sweep");
    runIncrementalEventbriteSweep().catch((e) =>
      console.error("[scheduler] Incremental sweep error:", e)
    );
  });

  // ── Eventbrite full sweep — every 6 hours (background, never awaited) ─────
  cron.schedule("0 */6 * * *", () => {
    console.log("[scheduler] Triggering Eventbrite full sweep");
    runFullEventbriteSweep().catch((e) =>
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
  // 1. Incremental sweep 8s after boot — fast, picks up recent events
  setTimeout(() => {
    console.log("[scheduler] Running startup incremental sweep...");
    runIncrementalEventbriteSweep().catch(() => {});
  }, 8_000);

  // 2. Job scrape 20s after boot
  setTimeout(() => {
    console.log("[scheduler] Running startup job scrape...");
    runJobScrape().catch(() => {});
  }, 20_000);

  // 3. Full Eventbrite sweep 60s after boot — long-running, runs in background
  setTimeout(() => {
    console.log("[scheduler] Launching full Eventbrite sweep in background...");
    runFullEventbriteSweep().catch(() => {}); // intentionally NOT awaited
  }, 60_000);
}
