/**
 * Global job board scrapers — no API keys required for most sources.
 * Sources: LinkedIn Guest API, Remotive, WeWorkRemotely, Reed, Greenhouse, Lever.
 */

import { db } from "../db";
import { jobs } from "../../shared/schema";
import { sql } from "drizzle-orm";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let jobScraperRunning = false;
let totalJobsScraped = 0;

// ── LinkedIn Guest API ─────────────────────────────────────────────────────────
async function scrapeLinkedIn(keywords: string[], locations: string[]): Promise<number> {
  let count = 0;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
  };

  for (const keyword of keywords) {
    for (const location of locations) {
      try {
        const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=0&count=25`;
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
        if (!resp.ok) continue;

        const html = await resp.text();
        // Parse job cards from LinkedIn HTML
        const jobMatches = Array.from(html.matchAll(/<li[^>]*class="[^"]*result-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g));

        for (const match of jobMatches) {
          const card = match[1];
          const titleMatch = card.match(/class="[^"]*job-result-card__title[^"]*"[^>]*>([^<]+)</);
          const companyMatch = card.match(/class="[^"]*job-result-card__subtitle[^"]*"[^>]*>([^<]+)</);
          const locationMatch = card.match(/class="[^"]*job-result-card__location[^"]*"[^>]*>([^<]+)</);
          const urlMatch = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/);

          if (!titleMatch || !urlMatch) continue;

          const jobData = {
            source: "linkedin",
            sourceId: urlMatch[1].match(/\/(\d+)\/?/)?.[1] ?? urlMatch[1],
            sourceUrl: urlMatch[1].split("?")[0],
            applyUrl: urlMatch[1],
            atsType: "linkedin_easy",
            title: titleMatch[1].trim().slice(0, 500),
            company: companyMatch?.[1].trim() ?? "",
            location: locationMatch?.[1].trim() ?? location,
            isRemote: location.toLowerCase().includes("remote") || card.toLowerCase().includes("remote"),
            workType: "onsite" as string,
            description: "",
            requirements: "",
            contractType: "full_time",
            status: "active",
            postedAt: new Date(),
            scrapedAt: new Date(),
          };

          await upsertJob(jobData);
          count++;
        }

        await sleep(2000); // Respect rate limits
      } catch (err) {
        console.error(`[jobs/linkedin] Error for ${keyword}/${location}:`, err);
      }
    }
  }
  return count;
}

// ── Remotive API (free, no key required) ──────────────────────────────────────
async function scrapeRemotive(): Promise<number> {
  let count = 0;
  try {
    const resp = await fetch("https://remotive.com/api/remote-jobs?limit=500", {
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return 0;
    const data = await resp.json();
    const jobList = data?.jobs ?? [];

    for (const job of jobList) {
      const jobData = {
        source: "remotive",
        sourceId: String(job.id),
        sourceUrl: job.url ?? "",
        applyUrl: job.url ?? "",
        atsType: "direct",
        title: (job.title ?? "").slice(0, 500),
        company: job.company_name ?? "",
        location: job.candidate_required_location ?? "Remote",
        isRemote: true,
        workType: "remote",
        description: (job.description ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
        requirements: "",
        salaryMin: null as number | null,
        salaryMax: null as number | null,
        contractType: job.job_type ?? "full_time",
        status: "active",
        postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
        scrapedAt: new Date(),
      };

      await upsertJob(jobData);
      count++;
    }
  } catch (err) {
    console.error("[jobs/remotive] Error:", err);
  }
  return count;
}

// ── WeWorkRemotely (RSS feed) ─────────────────────────────────────────────────
async function scrapeWeWorkRemotely(): Promise<number> {
  let count = 0;
  const feeds = [
    "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
    "https://weworkremotely.com/categories/remote-management-and-finance-jobs.rss",
    "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
    "https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss",
    "https://weworkremotely.com/categories/remote-design-jobs.rss",
    "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
    "https://weworkremotely.com/categories/remote-product-jobs.rss",
    "https://weworkremotely.com/categories/remote-customer-support-jobs.rss",
  ];

  for (const feedUrl of feeds) {
    try {
      const resp = await fetch(feedUrl, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) continue;
      const xml = await resp.text();

      const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g));
      for (const item of items) {
        const content = item[1];
        const titleMatch = content.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/);
        const linkMatch = content.match(/<link>([^<]+)<\/link>/);
        const companyMatch = content.match(/<company><!\[CDATA\[([^\]]+)\]\]><\/company>/);
        const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
        const pubDateMatch = content.match(/<pubDate>([^<]+)<\/pubDate>/);

        if (!titleMatch || !linkMatch) continue;

        const jobData = {
          source: "weworkremotely",
          sourceId: linkMatch[1].split("/").pop() ?? linkMatch[1],
          sourceUrl: linkMatch[1],
          applyUrl: linkMatch[1],
          atsType: "direct",
          title: titleMatch[1].replace(/^[^:]+:\s*/, "").trim().slice(0, 500),
          company: companyMatch?.[1] ?? "",
          location: "Remote",
          isRemote: true,
          workType: "remote",
          description: (descMatch?.[1] ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
          requirements: "",
          contractType: "full_time",
          status: "active",
          postedAt: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          scrapedAt: new Date(),
        };

        await upsertJob(jobData);
        count++;
      }
      await sleep(1000);
    } catch (err) {
      console.error(`[jobs/weworkremotely] Feed error ${feedUrl}:`, err);
    }
  }
  return count;
}

// ── Reed.co.uk (free API — needs REED_API_KEY env, very easy to get free) ─────
async function scrapeReed(): Promise<number> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) {
    console.log("[jobs/reed] REED_API_KEY not set, skipping Reed scrape.");
    return 0;
  }

  let count = 0;
  const keywords = ["software engineer", "product manager", "data analyst", "marketing", "finance", "sales", "nursing", "teacher", "accountant", "developer"];
  const locations = ["london", "manchester", "birmingham", "edinburgh", "bristol"];

  for (const keyword of keywords) {
    for (const location of locations) {
      try {
        const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(keyword)}&locationName=${encodeURIComponent(location)}&resultsToSkip=0&resultsToTake=100`;
        const resp = await fetch(url, {
          headers: { "Authorization": "Basic " + Buffer.from(apiKey + ":").toString("base64") },
          signal: AbortSignal.timeout(15000),
        });
        if (!resp.ok) continue;
        const data = await resp.json();

        for (const job of data?.results ?? []) {
          const jobData = {
            source: "reed",
            sourceId: String(job.jobId),
            sourceUrl: `https://www.reed.co.uk/jobs/${job.jobId}`,
            applyUrl: job.jobUrl ?? `https://www.reed.co.uk/jobs/${job.jobId}`,
            atsType: "direct",
            title: (job.jobTitle ?? "").slice(0, 500),
            company: job.employerName ?? "",
            location: job.locationName ?? location,
            isRemote: job.locationName?.toLowerCase().includes("remote") ?? false,
            workType: "onsite",
            description: (job.jobDescription ?? "").slice(0, 5000),
            requirements: "",
            salaryMin: job.minimumSalary ? Math.round(job.minimumSalary) : null,
            salaryMax: job.maximumSalary ? Math.round(job.maximumSalary) : null,
            currency: "GBP",
            contractType: job.contractType === "Permanent" ? "full_time" : "contract",
            status: "active",
            postedAt: job.date ? new Date(job.date) : new Date(),
            scrapedAt: new Date(),
          };
          await upsertJob(jobData);
          count++;
        }
        await sleep(500);
      } catch (err) {
        console.error(`[jobs/reed] Error for ${keyword}/${location}:`, err);
      }
    }
  }
  return count;
}

// ── Greenhouse public job boards ──────────────────────────────────────────────
async function scrapeGreenhouse(companyBoardTokens: string[]): Promise<number> {
  let count = 0;
  for (const token of companyBoardTokens) {
    try {
      const resp = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const data = await resp.json();

      for (const job of data?.jobs ?? []) {
        const jobData = {
          source: "greenhouse",
          sourceId: String(job.id),
          sourceUrl: job.absolute_url ?? "",
          applyUrl: job.absolute_url ?? "",
          atsType: "greenhouse",
          title: (job.title ?? "").slice(0, 500),
          company: token,
          location: job.location?.name ?? "",
          isRemote: (job.location?.name ?? "").toLowerCase().includes("remote"),
          workType: "onsite",
          description: (job.content ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
          requirements: "",
          contractType: "full_time",
          status: "active",
          postedAt: job.updated_at ? new Date(job.updated_at) : new Date(),
          scrapedAt: new Date(),
        };
        await upsertJob(jobData);
        count++;
      }
      await sleep(500);
    } catch {
      // skip failing boards
    }
  }
  return count;
}

// ── Himalayas (free remote jobs API) ─────────────────────────────────────────
async function scrapeHimalayas(): Promise<number> {
  let count = 0;
  try {
    const resp = await fetch("https://himalayas.app/jobs/api?limit=500", {
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) return 0;
    const data = await resp.json();

    for (const job of data?.jobs ?? []) {
      const jobData = {
        source: "himalayas",
        sourceId: String(job.id ?? job.slug),
        sourceUrl: job.applicationLink ?? `https://himalayas.app/jobs/${job.slug}`,
        applyUrl: job.applicationLink ?? `https://himalayas.app/jobs/${job.slug}`,
        atsType: "direct",
        title: (job.title ?? "").slice(0, 500),
        company: job.companyName ?? "",
        location: "Remote",
        isRemote: true,
        workType: "remote",
        description: (job.description ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
        requirements: "",
        salaryMin: job.salaryRange?.min ?? null,
        salaryMax: job.salaryRange?.max ?? null,
        currency: job.salaryRange?.currency ?? "USD",
        contractType: "full_time",
        status: "active",
        postedAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        scrapedAt: new Date(),
      };
      await upsertJob(jobData);
      count++;
    }
  } catch (err) {
    console.error("[jobs/himalayas] Error:", err);
  }
  return count;
}

// ── Core upsert ───────────────────────────────────────────────────────────────
async function upsertJob(jobData: any): Promise<void> {
  if (!jobData.title || !jobData.sourceUrl) return;
  try {
    await db
      .insert(jobs)
      .values(jobData)
      .onConflictDoUpdate({
        target: jobs.sourceUrl,
        set: {
          title: jobData.title,
          description: jobData.description ?? "",
          status: "active",
          scrapedAt: new Date(),
        },
      });
  } catch {
    // Skip duplicate / constraint errors silently
  }
}

/** Mark jobs older than 60 days as expired */
export async function expireOldJobs(): Promise<void> {
  try {
    await db
      .update(jobs)
      .set({ status: "expired" })
      .where(sql`posted_at < NOW() - INTERVAL '60 days' AND status = 'active'`);
  } catch (err) {
    console.error("[jobs] Error expiring jobs:", err);
  }
}

/** Popular Greenhouse company boards to scrape */
const GREENHOUSE_BOARDS = [
  "stripe", "airbnb", "shopify", "github", "figma", "notion", "linear",
  "airtable", "databricks", "snowflake", "confluent", "hashicorp",
  "mongodb", "elastic", "cloudflare", "fastly", "datadog", "newrelic",
  "twilio", "sendgrid", "segment", "brex", "rippling", "gusto",
];

/** Run all job scrapers */
export async function runJobScrape(): Promise<void> {
  if (jobScraperRunning) {
    console.log("[jobs] Scraper already running, skipping.");
    return;
  }
  jobScraperRunning = true;
  console.log("[jobs] Starting job scrape...");

  const keywords = [
    "software engineer", "product manager", "data scientist", "data analyst",
    "marketing manager", "finance analyst", "sales manager", "designer",
    "devops engineer", "project manager", "business analyst", "developer",
    "nurse", "teacher", "accountant", "lawyer", "doctor", "recruiter",
  ];

  const locations = [
    "London", "Manchester", "Birmingham", "Edinburgh", "Bristol",
    "Remote UK", "United Kingdom",
  ];

  try {
    const [linkedInCount, remotiveCount, wwrCount, reedCount, greenhouseCount, himalayasCount] = await Promise.all([
      scrapeLinkedIn(keywords.slice(0, 6), locations.slice(0, 4)),
      scrapeRemotive(),
      scrapeWeWorkRemotely(),
      scrapeReed(),
      scrapeGreenhouse(GREENHOUSE_BOARDS),
      scrapeHimalayas(),
    ]);

    const total = linkedInCount + remotiveCount + wwrCount + reedCount + greenhouseCount + himalayasCount;
    totalJobsScraped += total;
    console.log(`[jobs] Scrape complete. LinkedIn:${linkedInCount} Remotive:${remotiveCount} WWR:${wwrCount} Reed:${reedCount} Greenhouse:${greenhouseCount} Himalayas:${himalayasCount} Total:${total}`);
  } catch (err) {
    console.error("[jobs] Scrape error:", err);
  } finally {
    jobScraperRunning = false;
  }
}

export function getJobScraperStatus() {
  return { running: jobScraperRunning, totalJobsScraped };
}
