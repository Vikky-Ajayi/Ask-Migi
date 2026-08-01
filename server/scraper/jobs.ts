/**
 * Global job board scrapers — no API keys required for most sources.
 * Sources: LinkedIn Guest API, Remotive, WeWorkRemotely, Reed, Greenhouse, Himalayas, Adzuna.
 */

import { db } from "../db";
import { jobs } from "../../shared/schema";
import { sql } from "drizzle-orm";
import pLimit from "p-limit";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let jobScraperRunning = false;
let totalJobsScraped = 0;

// ── Core upsert ───────────────────────────────────────────────────────────────
async function upsertJob(jobData: Record<string, unknown>): Promise<void> {
  if (!jobData.title || !jobData.sourceUrl) return;
  try {
    await db
      .insert(jobs)
      .values(jobData as any)
      .onConflictDoUpdate({
        target: jobs.sourceUrl,
        set: {
          title: jobData.title as string,
          description: (jobData.description as string) ?? "",
          status: "active",
          scrapedAt: new Date(),
        },
      });
  } catch {
    // Skip duplicate / constraint errors silently
  }
}

// ── LinkedIn Guest API ─────────────────────────────────────────────────────────
async function scrapeLinkedIn(keywords: string[], locations: string[]): Promise<number> {
  let count = 0;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
  };

  const limit = pLimit(3); // gentle on LinkedIn
  const tasks = keywords.flatMap((keyword) =>
    locations.map((location) =>
      limit(async () => {
        try {
          const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&start=0&count=25`;
          const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
          if (!resp.ok) return 0;
          const html = await resp.text();

          const jobMatches = Array.from(
            html.matchAll(/<li[^>]*class="[^"]*result-card[^"]*"[^>]*>([\s\S]*?)<\/li>/g)
          );
          let localCount = 0;

          for (const match of jobMatches) {
            const card = match[1];
            const titleMatch = card.match(/class="[^"]*job-result-card__title[^"]*"[^>]*>([^<]+)</);
            const companyMatch = card.match(/class="[^"]*job-result-card__subtitle[^"]*"[^>]*>([^<]+)</);
            const locationMatch = card.match(/class="[^"]*job-result-card__location[^"]*"[^>]*>([^<]+)</);
            const urlMatch = card.match(/href="(https:\/\/www\.linkedin\.com\/jobs\/view\/[^"]+)"/);
            if (!titleMatch || !urlMatch) continue;

            await upsertJob({
              source: "linkedin",
              sourceId: urlMatch[1].match(/\/(\d+)\/?/)?.[1] ?? urlMatch[1],
              sourceUrl: urlMatch[1].split("?")[0],
              applyUrl: urlMatch[1],
              atsType: "linkedin_easy",
              title: titleMatch[1].trim().slice(0, 500),
              company: companyMatch?.[1].trim() ?? "",
              location: locationMatch?.[1].trim() ?? location,
              isRemote: location.toLowerCase().includes("remote") || card.toLowerCase().includes("remote"),
              workType: "onsite",
              description: "",
              requirements: "",
              contractType: "full_time",
              status: "active",
              postedAt: new Date(),
              scrapedAt: new Date(),
            });
            localCount++;
          }

          await sleep(2000);
          return localCount;
        } catch {
          return 0;
        }
      })
    )
  );

  const results = await Promise.all(tasks);
  count = results.reduce((a, b) => a + b, 0);
  return count;
}

// ── Remotive API (free, no key) ───────────────────────────────────────────────
async function scrapeRemotive(): Promise<number> {
  let count = 0;
  try {
    const resp = await fetch("https://remotive.com/api/remote-jobs?limit=500", {
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) return 0;
    const data = await resp.json();

    for (const job of data?.jobs ?? []) {
      await upsertJob({
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
        contractType: job.job_type ?? "full_time",
        status: "active",
        postedAt: job.publication_date ? new Date(job.publication_date) : new Date(),
        scrapedAt: new Date(),
      });
      count++;
    }
  } catch (err) {
    console.error("[jobs/remotive] Error:", err);
  }
  return count;
}

// ── WeWorkRemotely (RSS) ──────────────────────────────────────────────────────
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
        const c = item[1];
        const titleMatch = c.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/);
        const linkMatch = c.match(/<link>([^<]+)<\/link>/);
        const companyMatch = c.match(/<company><!\[CDATA\[([^\]]+)\]\]><\/company>/);
        const descMatch = c.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
        const pubDateMatch = c.match(/<pubDate>([^<]+)<\/pubDate>/);
        if (!titleMatch || !linkMatch) continue;

        await upsertJob({
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
        });
        count++;
      }
      await sleep(1000);
    } catch {
      // skip failing feeds
    }
  }
  return count;
}

// ── Reed.co.uk API ─────────────────────────────────────────────────────────────
async function scrapeReed(): Promise<number> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) {
    console.log("[jobs/reed] REED_API_KEY not set, skipping Reed scrape.");
    return 0;
  }

  const keywords = [
    "software engineer", "developer", "product manager", "data scientist",
    "data analyst", "business analyst", "project manager", "devops engineer",
    "marketing manager", "digital marketing", "content marketing",
    "finance analyst", "financial analyst", "accountant", "chartered accountant",
    "sales manager", "account manager", "sales executive",
    "graphic designer", "ux designer", "ui designer",
    "hr manager", "human resources", "recruiter", "talent acquisition",
    "nurse", "registered nurse", "healthcare assistant",
    "teacher", "teaching assistant", "lecturer",
    "lawyer", "solicitor", "paralegal",
    "operations manager", "supply chain", "logistics",
    "customer success", "customer service",
    "cybersecurity", "information security", "cloud engineer",
    "machine learning", "ai engineer",
  ];

  const locations = [
    "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow",
    "Bristol", "Leeds", "Sheffield", "Liverpool", "Nottingham",
    "Leicester", "Cardiff", "Newcastle", "Reading", "Oxford",
    "Cambridge", "Southampton", "Portsmouth", "Brighton", "Coventry",
  ];

  const limit = pLimit(5);
  const tasks = keywords.flatMap((keyword) =>
    locations.map((location) =>
      limit(async () => {
        let count = 0;
        try {
          // Page through results (100 per page, skip 0 and 100)
          for (const skip of [0, 100, 200]) {
            const url = `https://www.reed.co.uk/api/1.0/search?keywords=${encodeURIComponent(keyword)}&locationName=${encodeURIComponent(location)}&resultsToSkip=${skip}&resultsToTake=100`;
            const resp = await fetch(url, {
              headers: { Authorization: "Basic " + Buffer.from(apiKey + ":").toString("base64") },
              signal: AbortSignal.timeout(15000),
            });
            if (!resp.ok) break;
            const data = await resp.json();
            const results = data?.results ?? [];
            if (results.length === 0) break;

            for (const job of results) {
              await upsertJob({
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
              });
              count++;
            }

            if (results.length < 100) break;
            await sleep(300);
          }
        } catch {
          // skip
        }
        return count;
      })
    )
  );

  const results = await Promise.all(tasks);
  const total = results.reduce((a, b) => a + b, 0);
  console.log(`[jobs/reed] Scraped ${total} jobs`);
  return total;
}

// ── Greenhouse public job boards ──────────────────────────────────────────────
const GREENHOUSE_BOARDS = [
  "stripe", "airbnb", "shopify", "github", "figma", "notion", "linear",
  "airtable", "databricks", "snowflake", "confluent", "hashicorp",
  "mongodb", "elastic", "cloudflare", "fastly", "datadog", "newrelic",
  "twilio", "sendgrid", "segment", "brex", "rippling", "gusto",
  "intercom", "hubspot", "zendesk", "asana", "monday", "clickup",
  "atlassian", "canva", "loom", "miro", "zapier", "webflow",
  "vercel", "netlify", "supabase", "render", "railway",
  "anthropic", "openai", "cohere", "mistral", "huggingface",
  "deepmind", "waymo", "cruise", "nuro", "zoox",
  "revolut", "monzo", "starling", "wise", "plaid", "checkout",
  "deliveroo", "gopuff", "getir", "zapp", "gorillas",
  "babylon", "healx", "benevolentai", "exscientia",
  "improbable", "raspberry-pi", "arm", "ocado",
];

async function scrapeGreenhouse(): Promise<number> {
  const limit = pLimit(10);
  let count = 0;

  const tasks = GREENHOUSE_BOARDS.map((token) =>
    limit(async () => {
      let localCount = 0;
      try {
        const resp = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!resp.ok) return 0;
        const data = await resp.json();

        for (const job of data?.jobs ?? []) {
          await upsertJob({
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
          });
          localCount++;
        }
      } catch {
        // skip failing boards
      }
      return localCount;
    })
  );

  const results = await Promise.all(tasks);
  count = results.reduce((a, b) => a + b, 0);
  console.log(`[jobs/greenhouse] Scraped ${count} jobs from ${GREENHOUSE_BOARDS.length} boards`);
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
      await upsertJob({
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
      });
      count++;
    }
  } catch (err) {
    console.error("[jobs/himalayas] Error:", err);
  }
  return count;
}

// ── Adzuna API (free tier, UK-heavy) ──────────────────────────────────────────
async function scrapeAdzuna(): Promise<number> {
  // Adzuna requires free registration — skip if keys not set
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    return 0; // silently skip — keys optional
  }

  const categories = [
    "it-jobs", "engineering-jobs", "accounting-finance-jobs", "sales-jobs",
    "marketing-jobs", "hr-jobs", "healthcare-nursing-jobs", "teaching-jobs",
  ];

  let count = 0;
  const limit = pLimit(4);
  const tasks = categories.map((cat) =>
    limit(async () => {
      let localCount = 0;
      try {
        for (let page = 1; page <= 5; page++) {
          const url = `https://api.adzuna.com/v1/api/jobs/gb/search/${page}?app_id=${appId}&app_key=${appKey}&results_per_page=50&category=${cat}&content-type=application/json`;
          const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
          if (!resp.ok) break;
          const data = await resp.json();
          const results: any[] = data?.results ?? [];
          if (results.length === 0) break;

          for (const job of results) {
            await upsertJob({
              source: "adzuna",
              sourceId: String(job.id),
              sourceUrl: job.redirect_url ?? "",
              applyUrl: job.redirect_url ?? "",
              atsType: "direct",
              title: (job.title ?? "").slice(0, 500),
              company: job.company?.display_name ?? "",
              location: job.location?.display_name ?? "UK",
              isRemote: false,
              workType: "onsite",
              description: (job.description ?? "").slice(0, 5000),
              requirements: "",
              salaryMin: job.salary_min ? Math.round(job.salary_min) : null,
              salaryMax: job.salary_max ? Math.round(job.salary_max) : null,
              currency: "GBP",
              contractType: job.contract_time === "part_time" ? "part_time" : "full_time",
              status: "active",
              postedAt: job.created ? new Date(job.created) : new Date(),
              scrapedAt: new Date(),
            });
            localCount++;
          }
          await sleep(500);
        }
      } catch {
        // skip
      }
      return localCount;
    })
  );

  const results = await Promise.all(tasks);
  count = results.reduce((a, b) => a + b, 0);
  if (count > 0) console.log(`[jobs/adzuna] Scraped ${count} jobs`);
  return count;
}

// ── Expire old jobs ───────────────────────────────────────────────────────────
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

// ── Run all scrapers ───────────────────────────────────────────────────────────
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
    const [linkedInCount, remotiveCount, wwrCount, reedCount, greenhouseCount, himalayasCount, adzunaCount] =
      await Promise.all([
        scrapeLinkedIn(keywords.slice(0, 6), locations.slice(0, 4)),
        scrapeRemotive(),
        scrapeWeWorkRemotely(),
        scrapeReed(),
        scrapeGreenhouse(),
        scrapeHimalayas(),
        scrapeAdzuna(),
      ]);

    const total = linkedInCount + remotiveCount + wwrCount + reedCount + greenhouseCount + himalayasCount + adzunaCount;
    totalJobsScraped += total;
    console.log(
      `[jobs] Scrape complete. LinkedIn:${linkedInCount} Remotive:${remotiveCount} WWR:${wwrCount} ` +
      `Reed:${reedCount} Greenhouse:${greenhouseCount} Himalayas:${himalayasCount} Adzuna:${adzunaCount} Total:${total}`
    );
  } catch (err) {
    console.error("[jobs] Scrape error:", err);
  } finally {
    jobScraperRunning = false;
  }
}

export function getJobScraperStatus() {
  return { running: jobScraperRunning, totalJobsScraped };
}
