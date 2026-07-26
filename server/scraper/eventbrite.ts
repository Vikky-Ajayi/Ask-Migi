/**
 * Eventbrite UK scraper — uses Eventbrite's internal destination search endpoint.
 * No API key required. Enumerates UK cities × categories to maximise coverage.
 */

import { db } from "../db";
import { events } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

// ── UK city slugs for Eventbrite search ────────────────────────────────────────
const UK_CITIES = [
  "london", "manchester", "birmingham", "leeds", "glasgow", "edinburgh",
  "liverpool", "sheffield", "bristol", "cambridge", "oxford", "nottingham",
  "cardiff", "belfast", "newcastle", "leicester", "coventry", "bradford",
  "stoke-on-trent", "wolverhampton", "plymouth", "derby", "swansea",
  "southampton", "portsmouth", "reading", "luton", "exeter", "york",
  "milton-keynes", "sunderland", "hull", "norwich", "peterborough",
  "brighton", "brentwood", "bath", "chester", "durham", "ipswich",
  "lincoln", "gloucester", "worcester", "hereford", "shrewsbury",
  "carlisle", "inverness", "aberdeen", "dundee", "stirling", "perth",
  "st-andrews", "colchester", "ely", "truro", "salisbury", "oxford",
  "guildford", "watford", "basildon", "southend-on-sea", "chelmsford",
  "hastings", "eastbourne", "worthing", "crawley", "horsham", "maidstone",
  "folkestone", "Canterbury", "rochester", "medway", "tunbridge-wells",
  "basingstoke", "aldershot", "farnborough", "bournemouth", "poole",
  "weymouth", "taunton", "weston-super-mare", "yeovil", "barnstaple",
  "torquay", "paignton", "newquay", "falmouth", "penzance",
  "huddersfield", "wakefield", "rotherham", "barnsley", "doncaster",
  "grimsby", "scunthorpe", "loughborough", "northampton", "bedford",
  "stevenage", "harlow", "hertford", "st-albans", "aylesbury",
  "slough", "windsor", "maidenhead", "wokingham", "bracknell",
  "swindon", "chippenham", "trowbridge", "wiltshire",
  "telford", "stafford", "burton-on-trent", "tamworth", "lichfield",
  "walsall", "west-bromwich", "dudley", "kidderminster",
  "crewe", "warrington", "stockport", "oldham", "rochdale", "bolton",
  "bury", "salford", "wigan", "st-helens", "blackburn", "burnley",
  "blackpool", "lancaster", "barrow-in-furness", "kendal",
  "middlesbrough", "darlington", "hartlepool", "stockton-on-tees",
];

// ── Eventbrite categories ──────────────────────────────────────────────────────
const CATEGORIES = [
  "101",  // Business & Professional
  "102",  // Science & Technology
  "103",  // Music
  "104",  // Film, Media & Entertainment
  "105",  // Arts
  "106",  // Fashion & Beauty
  "107",  // Health & Wellness
  "108",  // Sports & Fitness
  "109",  // Travel & Outdoor
  "110",  // Food & Drink
  "111",  // Charity & Causes
  "112",  // Government & Politics
  "113",  // Community & Culture
  "114",  // Family & Education
  "115",  // Religion & Spirituality
  "116",  // Holiday & Seasonal
  "117",  // Home & Lifestyle
  "118",  // Auto, Boat & Air
  "119",  // Hobbies & Special Interest
  "199",  // Other
];

// ── Networking keywords for additional sweeps ──────────────────────────────────
const NETWORKING_KEYWORDS = [
  "networking", "conference", "summit", "workshop", "seminar", "meetup",
  "hackathon", "pitch", "startup", "career", "professional development",
  "leadership", "entrepreneurship", "tech talk", "panel discussion",
];

let scraperRunning = false;
let totalScraped = 0;

interface EventbriteEvent {
  id: string;
  name?: { text?: string };
  description?: { text?: string };
  url?: string;
  start?: { utc?: string };
  end?: { utc?: string };
  is_free?: boolean;
  is_online_event?: boolean;
  category_id?: string;
  venue?: {
    address?: {
      city?: string;
      postal_code?: string;
      address_1?: string;
      localized_address_display?: string;
    };
    name?: string;
    latitude?: string;
    longitude?: string;
  };
  logo?: { url?: string };
  organizer?: { name?: string };
  ticket_availability?: { minimum_ticket_price?: { major_value?: string }; maximum_ticket_price?: { major_value?: string } };
}

async function fetchEventbriteSearch(
  city: string,
  categoryId: string,
  page: number
): Promise<{ events: EventbriteEvent[]; hasMore: boolean }> {
  const url = new URL("https://www.eventbrite.co.uk/d/united-kingdom--" + city + "/events--" + categoryId + "/");
  // Use the internal API endpoint
  const apiUrl = `https://www.eventbrite.co.uk/api/v3/destination/search/?q=&place_atlas_id=&categories=${categoryId}&page=${page}&page_size=50&date_range=&location.place_atlas_id=&location.address=united+kingdom+${city}&search_type=all`;

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-GB,en;q=0.9",
    "Referer": "https://www.eventbrite.co.uk/",
    "Origin": "https://www.eventbrite.co.uk",
  };

  try {
    const resp = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return { events: [], hasMore: false };
    const data = await resp.json();
    const evts: EventbriteEvent[] = data?.events?.results ?? data?.events ?? [];
    const pagination = data?.events?.pagination ?? data?.pagination ?? {};
    const hasMore = pagination?.has_more_items ?? (evts.length === 50);
    return { events: evts, hasMore };
  } catch {
    return { events: [], hasMore: false };
  }
}

async function fetchByKeyword(keyword: string, page: number): Promise<{ events: EventbriteEvent[]; hasMore: boolean }> {
  const apiUrl = `https://www.eventbrite.co.uk/api/v3/destination/search/?q=${encodeURIComponent(keyword)}&location.address=united+kingdom&page=${page}&page_size=50`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://www.eventbrite.co.uk/",
  };
  try {
    const resp = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return { events: [], hasMore: false };
    const data = await resp.json();
    const evts: EventbriteEvent[] = data?.events?.results ?? data?.events ?? [];
    const hasMore = (data?.events?.pagination?.has_more_items) ?? (evts.length === 50);
    return { events: evts, hasMore };
  } catch {
    return { events: [], hasMore: false };
  }
}

function mapCategory(categoryId: string): string {
  const map: Record<string, string> = {
    "101": "Business & Professional", "102": "Science & Technology",
    "103": "Music", "104": "Film & Entertainment", "105": "Arts",
    "106": "Fashion", "107": "Health & Wellness", "108": "Sports",
    "109": "Travel", "110": "Food & Drink", "111": "Charity",
    "112": "Government", "113": "Community", "114": "Education",
    "115": "Religion", "116": "Holiday", "117": "Home & Lifestyle",
    "118": "Auto", "119": "Hobbies", "199": "Other",
  };
  return map[categoryId] ?? "Other";
}

async function upsertEvent(evt: EventbriteEvent, categoryId: string): Promise<boolean> {
  if (!evt.id || !evt.name?.text) return false;

  const startDate = evt.start?.utc ? new Date(evt.start.utc) : null;
  if (!startDate) return false;

  // Skip events older than 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (startDate < cutoff) return false;

  const record = {
    eventbriteId: evt.id,
    title: evt.name.text.slice(0, 500),
    description: (evt.description?.text ?? "").slice(0, 5000),
    category: mapCategory(categoryId),
    locationCity: evt.venue?.address?.city ?? "",
    locationPostcode: evt.venue?.address?.postal_code ?? "",
    locationVenue: evt.venue?.name ?? "",
    locationAddress: evt.venue?.address?.localized_address_display ?? evt.venue?.address?.address_1 ?? "",
    lat: evt.venue?.latitude ?? null,
    lng: evt.venue?.longitude ?? null,
    startDate,
    endDate: evt.end?.utc ? new Date(evt.end.utc) : null,
    url: evt.url ?? "",
    organizerName: evt.organizer?.name ?? "",
    isFree: evt.is_free ?? false,
    isOnline: evt.is_online_event ?? false,
    thumbnailUrl: evt.logo?.url ?? "",
    status: "active",
    scrapedAt: new Date(),
  };

  try {
    await db
      .insert(events)
      .values(record)
      .onConflictDoUpdate({
        target: events.eventbriteId,
        set: {
          title: record.title,
          description: record.description,
          startDate: record.startDate,
          endDate: record.endDate,
          status: "active",
          scrapedAt: record.scrapedAt,
        },
      });
    return true;
  } catch {
    return false;
  }
}

/** Sleep between requests to be polite */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run a full UK sweep across all cities × categories */
export async function runFullEventbriteSweep(): Promise<void> {
  if (scraperRunning) {
    console.log("[eventbrite] Scraper already running, skipping.");
    return;
  }
  scraperRunning = true;
  console.log("[eventbrite] Starting full UK sweep...");

  let newEvents = 0;

  // City × category sweep
  for (const city of UK_CITIES) {
    for (const categoryId of CATEGORIES) {
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 20) { // max 20 pages = 1000 events per city/category combo
        const { events: evts, hasMore: more } = await fetchEventbriteSearch(city, categoryId, page);
        hasMore = more;

        for (const evt of evts) {
          const inserted = await upsertEvent(evt, categoryId);
          if (inserted) newEvents++;
        }

        if (evts.length === 0) break;
        page++;
        await sleep(800); // ~75 req/min per worker, polite rate
      }
    }
  }

  // Keyword sweep for networking/professional events
  for (const keyword of NETWORKING_KEYWORDS) {
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 10) {
      const { events: evts, hasMore: more } = await fetchByKeyword(keyword, page);
      hasMore = more;
      for (const evt of evts) await upsertEvent(evt, "101");
      if (evts.length === 0) break;
      page++;
      await sleep(600);
    }
  }

  totalScraped += newEvents;
  console.log(`[eventbrite] Full sweep complete. New/updated: ${newEvents}. Total lifetime: ${totalScraped}`);
  scraperRunning = false;
}

/** Incremental sweep — only fetches recent/upcoming events */
export async function runIncrementalEventbriteSweep(): Promise<void> {
  if (scraperRunning) return;
  console.log("[eventbrite] Running incremental sweep...");

  // Keyword sweep with networking terms (faster, catches newly added events)
  let newEvents = 0;
  for (const keyword of NETWORKING_KEYWORDS) {
    const { events: evts } = await fetchByKeyword(keyword, 1);
    for (const evt of evts) {
      const inserted = await upsertEvent(evt, "101");
      if (inserted) newEvents++;
    }
    await sleep(500);
  }

  console.log(`[eventbrite] Incremental sweep done. New/updated: ${newEvents}`);
}

/** Mark events that have passed as expired */
export async function expireOldEvents(): Promise<void> {
  try {
    await db
      .update(events)
      .set({ status: "expired" })
      .where(sql`start_date < NOW() - INTERVAL '1 day' AND status = 'active'`);
    console.log("[eventbrite] Expired old events.");
  } catch (err) {
    console.error("[eventbrite] Error expiring events:", err);
  }
}

export function getScraperStatus() {
  return { running: scraperRunning, totalScraped };
}
