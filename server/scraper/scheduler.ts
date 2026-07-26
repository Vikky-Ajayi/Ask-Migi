/**
 * Scraper scheduler — runs Eventbrite and job scrapers on a cron schedule.
 * Uses node-cron so it runs inside the main server process.
 */

import cron from "node-cron";
import { runFullEventbriteSweep, runIncrementalEventbriteSweep, expireOldEvents } from "./eventbrite";
import { runJobScrape, expireOldJobs } from "./jobs";

let schedulerStarted = false;

export function startScraperScheduler(): void {
  if (schedulerStarted) return;
  schedulerStarted = true;

  console.log("[scheduler] Starting scraper scheduler...");

  // Eventbrite incremental — every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("[scheduler] Triggering Eventbrite incremental sweep");
    await runIncrementalEventbriteSweep();
  });

  // Eventbrite full sweep — every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("[scheduler] Triggering Eventbrite full sweep");
    await runFullEventbriteSweep();
  });

  // Job scrape — every 2 hours
  cron.schedule("0 */2 * * *", async () => {
    console.log("[scheduler] Triggering job scrape");
    await runJobScrape();
  });

  // Cleanup — daily at 2am
  cron.schedule("0 2 * * *", async () => {
    console.log("[scheduler] Running daily cleanup");
    await Promise.all([expireOldEvents(), expireOldJobs()]);
  });

  // Run initial scrapes on startup (staggered to not slam the server)
  setTimeout(async () => {
    console.log("[scheduler] Running initial Eventbrite incremental sweep...");
    await runIncrementalEventbriteSweep();
  }, 5000);

  setTimeout(async () => {
    console.log("[scheduler] Running initial job scrape...");
    await runJobScrape();
  }, 15000);

  setTimeout(async () => {
    console.log("[scheduler] Running initial Eventbrite full sweep (background)...");
    runFullEventbriteSweep(); // Don't await — runs in background
  }, 30000);
}
