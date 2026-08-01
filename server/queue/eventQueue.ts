/**
 * BullMQ event scraping queue.
 * Jobs are enqueued by the scheduler; workers process them in parallel.
 */

import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "./connection";

export interface EventScrapeJob {
  source: "meetup" | "luma";
  city: string;
  lat?: number;
  lon?: number;
  keyword?: string;
  cursor?: string; // pagination cursor
}

let queue: Queue<EventScrapeJob> | null = null;
let workerStarted = false;

export function getEventQueue(): Queue<EventScrapeJob> {
  if (queue) return queue;
  queue = new Queue<EventScrapeJob>("event-scrape", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 100 },
    },
  });
  return queue;
}

export async function enqueueEventSweep(
  cities: Array<{ name: string; lat: number; lon: number }>,
  keywords: string[]
): Promise<number> {
  const q = getEventQueue();
  const jobs: Array<{ name: string; data: EventScrapeJob }> = [];

  for (const city of cities) {
    // Add Luma city job
    jobs.push({
      name: `luma:${city.name}`,
      data: { source: "luma", city: city.name, lat: city.lat, lon: city.lon },
    });

    // Add Meetup keyword × city jobs
    for (const keyword of keywords) {
      jobs.push({
        name: `meetup:${city.name}:${keyword}`,
        data: {
          source: "meetup",
          city: city.name,
          lat: city.lat,
          lon: city.lon,
          keyword,
        },
      });
    }
  }

  await q.addBulk(jobs);
  console.log(`[eventQueue] Enqueued ${jobs.length} scrape jobs`);
  return jobs.length;
}

export function startEventWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  // Lazy import to avoid circular deps
  const worker = new Worker<EventScrapeJob>(
    "event-scrape",
    async (job: Job<EventScrapeJob>) => {
      // Dynamic import so the scraper module is loaded after worker start
      const { drainMeetupCity, drainLumaCity } = await import(
        "../scraper/events.js"
      );

      const { source, city, lat, lon, keyword } = job.data;
      let count = 0;

      if (source === "meetup" && lat !== undefined && lon !== undefined) {
        count = await drainMeetupCity({ lat, lon, city, keyword: keyword ?? "networking" });
      } else if (source === "luma") {
        count = await drainLumaCity(city);
      }

      return { count };
    },
    {
      connection: getRedisConnection(),
      concurrency: 10,
    }
  );

  worker.on("completed", (job, result) => {
    if ((result as any)?.count > 0) {
      console.log(
        `[eventQueue] ✓ ${job.data.source}/${job.data.city} → ${(result as any).count} events`
      );
    }
  });

  worker.on("failed", (job, err) => {
    console.error(`[eventQueue] ✗ ${job?.data.source}/${job?.data.city}: ${err.message}`);
  });

  console.log("[eventQueue] Worker started (concurrency=10)");
}
