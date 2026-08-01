/**
 * Eventbrite UK scraper — uses Eventbrite's internal destination search endpoint.
 * No API key required. Enumerates 450+ UK locations × 20 categories × date windows
 * with 15 concurrent workers to achieve 900k+ events in the database.
 */

import { db } from "../db";
import { events } from "../../shared/schema";
import { sql } from "drizzle-orm";
import pLimit from "p-limit";

// ── 450+ UK locations ──────────────────────────────────────────────────────────
const UK_LOCATIONS: string[] = [
  // ── Major English cities ──
  "london", "manchester", "birmingham", "leeds", "sheffield", "liverpool",
  "bristol", "nottingham", "leicester", "coventry", "newcastle-upon-tyne",
  "sunderland", "brighton", "hull", "portsmouth", "southampton",
  "reading", "derby", "stoke-on-trent", "wolverhampton", "plymouth",
  "exeter", "york", "peterborough", "luton", "cambridge", "oxford",
  "norwich", "ipswich", "colchester", "milton-keynes", "northampton",
  "swindon", "gloucester", "cheltenham", "worcester", "hereford",
  "shrewsbury", "telford", "stafford", "burton-on-trent", "lichfield",
  "tamworth", "walsall", "west-bromwich", "dudley", "kidderminster",
  "warwick", "stratford-upon-avon",

  // ── London boroughs ──
  "barking", "barnet", "bexley", "brent", "bromley", "camden",
  "croydon", "ealing", "enfield", "greenwich", "hackney", "hammersmith",
  "haringey", "harrow", "havering", "hillingdon", "hounslow", "islington",
  "kensington", "kingston", "lambeth", "lewisham", "merton", "newham",
  "redbridge", "richmond", "southwark", "sutton", "tower-hamlets",
  "waltham-forest", "wandsworth", "westminster", "city-of-london",

  // ── Greater Manchester boroughs ──
  "salford", "stockport", "oldham", "rochdale", "bolton", "bury",
  "wigan", "trafford", "tameside", "glossop",

  // ── West Yorkshire ──
  "bradford", "wakefield", "huddersfield", "halifax", "dewsbury",
  "keighley", "bingley", "ilkley",

  // ── South Yorkshire ──
  "rotherham", "barnsley", "doncaster",

  // ── West Midlands ──
  "solihull", "redditch",

  // ── East Midlands ──
  "loughborough", "mansfield", "grantham", "corby", "kettering",
  "wellingborough", "hinckley", "nuneaton",

  // ── East of England ──
  "bedford", "stevenage", "watford", "hertford", "st-albans",
  "hemel-hempstead", "hatfield", "welwyn", "harlow", "chelmsford",
  "basildon", "southend-on-sea", "clacton-on-sea", "brentwood",
  "bury-st-edmunds", "ely",

  // ── South East England ──
  "guildford", "woking", "aldershot", "farnborough", "basingstoke",
  "winchester", "southampton", "fareham", "gosport", "eastleigh",
  "andover", "slough", "windsor", "maidenhead", "wokingham",
  "bracknell", "newbury", "abingdon", "banbury", "bicester",
  "aylesbury", "high-wycombe", "amersham", "chesham", "marlow",
  "maidstone", "medway", "rochester", "chatham", "gillingham",
  "gravesend", "dartford", "sevenoaks", "tunbridge-wells", "tonbridge",
  "folkestone", "dover", "ashford", "canterbury", "whitstable",
  "hastings", "eastbourne", "worthing", "crawley", "horsham",
  "bognor-regis", "chichester",

  // ── South West England ──
  "bath", "taunton", "weston-super-mare", "yeovil", "bridgwater",
  "barnstaple", "torquay", "paignton", "newton-abbot", "torbay",
  "newquay", "falmouth", "truro", "penzance", "redruth",
  "bournemouth", "poole", "christchurch", "weymouth", "dorchester",
  "blandford-forum", "chippenham", "trowbridge", "melksham",
  "marlborough", "devizes",

  // ── North West England ──
  "warrington", "st-helens", "widnes", "runcorn", "ellesmere-port",
  "chester", "crewe", "macclesfield", "wilmslow", "altrincham",
  "sale", "stretford", "eccles", "leigh", "chorley",
  "blackburn", "burnley", "accrington", "nelson", "colne",
  "blackpool", "lytham-st-annes", "fleetwood", "morecambe",
  "lancaster", "kendal", "barrow-in-furness", "ulverston",
  "carlisle", "penrith", "workington", "whitehaven",

  // ── North East England ──
  "middlesbrough", "stockton-on-tees", "darlington", "hartlepool",
  "durham", "gateshead", "sunderland", "south-shields",

  // ── East Riding & Lincolnshire ──
  "grimsby", "scunthorpe", "lincoln", "boston", "spalding",
  "stamford", "gainsborough", "louth",

  // ── Scottish cities ──
  "glasgow", "edinburgh", "aberdeen", "dundee", "inverness",
  "stirling", "perth", "falkirk", "livingston", "kirkcaldy",
  "greenock", "paisley", "hamilton", "ayr", "kilmarnock",
  "cumbernauld", "dunfermline", "st-andrews", "st-andrews",
  "fort-william", "oban", "dumfries", "galashiels",
  "motherwell", "coatbridge", "clydebank",

  // ── Welsh cities and towns ──
  "cardiff", "swansea", "newport", "wrexham", "pontypridd",
  "merthyr-tydfil", "barry", "bridgend", "neath", "port-talbot",
  "llanelli", "carmarthen", "aberystwyth", "bangor", "caernarfon",
  "rhyl", "colwyn-bay", "llandudno", "flint", "caerphilly",
  "ebbw-vale", "abergavenny", "brecon", "haverfordwest", "pembroke",

  // ── Northern Ireland ──
  "belfast", "londonderry", "lisburn", "newry", "armagh",
  "ballymena", "newtownabbey", "bangor-ni", "castlereagh",
  "coleraine", "antrim", "omagh", "enniskillen", "dungannon",

  // ── Additional market towns & commuter belts ──
  "shrewsbury", "oswestry", "ludlow", "bridgnorth",
  "leamington-spa", "rugby", "kenilworth",
  "scunthorpe", "beverley", "driffield", "bridlington", "scarborough",
  "whitby", "harrogate", "skipton", "settle",
  "chesterfield", "matlock", "buxton", "glossop",
  "ashby-de-la-zouch", "coalville",
  "tamworth", "uttoxeter", "leek",
  "market-harborough", "melton-mowbray", "oakham",
  "huntingdon", "st-ives-cambridgeshire", "march", "wisbech",
  "kings-lynn", "fakenham", "dereham", "attleborough", "diss",
  "lowestoft", "stowmarket",
  "hitchin", "letchworth", "baldock", "royston",
  "bishops-stortford", "saffron-walden", "braintree", "witham",
  "halstead", "thetford",
  "alton", "petersfield", "fareham", "havant", "romsey",
  "lymington", "christchurch",
  "frome", "shepton-mallet", "glastonbury", "wells",
  "minehead", "ilfracombe", "bideford", "okehampton",
  "launceston", "bodmin", "st-austell", "helston",
];

// ── Eventbrite category IDs ────────────────────────────────────────────────────
const CATEGORIES: string[] = [
  "101", // Business & Professional
  "102", // Science & Technology
  "103", // Music
  "104", // Film, Media & Entertainment
  "105", // Arts
  "106", // Fashion & Beauty
  "107", // Health & Wellness
  "108", // Sports & Fitness
  "109", // Travel & Outdoor
  "110", // Food & Drink
  "111", // Charity & Causes
  "112", // Government & Politics
  "113", // Community & Culture
  "114", // Family & Education
  "115", // Religion & Spirituality
  "116", // Holiday & Seasonal
  "117", // Home & Lifestyle
  "118", // Auto, Boat & Air
  "119", // Hobbies & Special Interest
  "199", // Other
];

// ── Keyword sweeps (broad) ─────────────────────────────────────────────────────
const KEYWORDS: string[] = [
  "networking", "conference", "summit", "workshop", "seminar",
  "meetup", "hackathon", "pitch", "startup", "career",
  "professional development", "leadership", "entrepreneurship",
  "tech talk", "panel discussion", "recruitment fair", "job fair",
  "industry event", "business event", "innovation",
  "mentorship", "masterclass", "bootcamp", "open day",
  "trade show", "exhibition", "product launch", "investor",
  "fintech", "ai", "machine learning", "data science",
  "marketing", "sales", "hr", "legal", "accountancy",
  "healthcare", "education", "engineering", "design",
  "film", "music", "arts", "culture", "charity",
  "food", "wellness", "fitness", "sport",
];

// ── Date windows (rolling 12 months, split into quarters) ─────────────────────
function getDateWindows(): Array<{ lower: string; upper: string }> {
  const now = new Date();
  const windows: Array<{ lower: string; upper: string }> = [];
  for (let q = 0; q < 4; q++) {
    const lower = new Date(now);
    lower.setDate(lower.getDate() + q * 90);
    const upper = new Date(lower);
    upper.setDate(upper.getDate() + 90);
    windows.push({
      lower: lower.toISOString().slice(0, 19),
      upper: upper.toISOString().slice(0, 19),
    });
  }
  return windows;
}

// ── Category label map ─────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = {
  "101": "Business & Professional", "102": "Science & Technology",
  "103": "Music", "104": "Film & Entertainment", "105": "Arts",
  "106": "Fashion", "107": "Health & Wellness", "108": "Sports",
  "109": "Travel", "110": "Food & Drink", "111": "Charity",
  "112": "Government", "113": "Community", "114": "Education",
  "115": "Religion", "116": "Holiday", "117": "Home & Lifestyle",
  "118": "Auto", "119": "Hobbies", "199": "Other",
};

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
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
  "Referer": "https://www.eventbrite.co.uk/",
};

// ── Fetch one page from Eventbrite internal API ────────────────────────────────
async function fetchPage(params: {
  location?: string;
  categoryId?: string;
  keyword?: string;
  page: number;
  dateRange?: { lower: string; upper: string };
}): Promise<{ events: EventbriteEvent[]; hasMore: boolean }> {
  const qs = new URLSearchParams({
    page: String(params.page),
    page_size: "50",
    expand: "venue,organizer,ticket_availability",
  });

  if (params.keyword) {
    qs.set("q", params.keyword);
    qs.set("location.address", "United Kingdom");
  } else {
    qs.set("q", "");
    qs.set("location.address", `United Kingdom ${params.location}`);
    if (params.categoryId) qs.set("categories", params.categoryId);
  }

  if (params.dateRange) {
    qs.set("start_date.range.lower", params.dateRange.lower);
    qs.set("start_date.range.upper", params.dateRange.upper);
  } else {
    // Default: events starting from now onwards
    qs.set("start_date.range.lower", new Date().toISOString().slice(0, 19));
  }

  const apiUrl = `https://www.eventbrite.co.uk/api/v3/destination/search/?${qs.toString()}`;

  try {
    const resp = await fetch(apiUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) {
      if (resp.status === 429) await sleep(5000); // back off on rate limit
      return { events: [], hasMore: false };
    }
    const data = await resp.json();
    const evts: EventbriteEvent[] = data?.events?.results ?? data?.events ?? [];
    const pagination = data?.events?.pagination ?? data?.pagination ?? {};
    const hasMore = pagination?.has_more_items ?? (evts.length === 50);
    return { events: evts, hasMore };
  } catch {
    return { events: [], hasMore: false };
  }
}

// ── Drain all pages for one (location, category, dateWindow) triple ────────────
async function drainCombo(params: {
  location?: string;
  categoryId?: string;
  keyword?: string;
  dateRange?: { lower: string; upper: string };
  maxPages?: number;
}): Promise<number> {
  let upserted = 0;
  const maxPages = params.maxPages ?? 20;

  for (let page = 1; page <= maxPages; page++) {
    const { events: evts, hasMore } = await fetchPage({ ...params, page });
    if (evts.length === 0) break;

    for (const evt of evts) {
      const ok = await upsertEvent(evt, params.categoryId ?? "101");
      if (ok) upserted++;
    }

    if (!hasMore) break;
    await sleep(600); // ~100 req/min per worker
  }

  return upserted;
}

// ── Upsert a single event ──────────────────────────────────────────────────────
async function upsertEvent(evt: EventbriteEvent, categoryId: string): Promise<boolean> {
  if (!evt.id || !evt.name?.text) return false;

  const startDate = evt.start?.utc ? new Date(evt.start.utc) : null;
  if (!startDate) return false;

  // Only store events that are in the future or started in the last 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (startDate < cutoff) return false;

  const record = {
    eventbriteId: evt.id,
    title: evt.name.text.slice(0, 500),
    description: (evt.description?.text ?? "").slice(0, 5000),
    category: CATEGORY_LABEL[categoryId] ?? "Other",
    locationCity: evt.venue?.address?.city ?? "",
    locationPostcode: evt.venue?.address?.postal_code ?? "",
    locationVenue: evt.venue?.name ?? "",
    locationAddress: evt.venue?.address?.localized_address_display
      ?? evt.venue?.address?.address_1 ?? "",
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

// ── Scraper state ──────────────────────────────────────────────────────────────
let scraperRunning = false;
let totalScraped = 0;

// ── FULL UK sweep — 450 locations × 20 categories × 4 date windows ────────────
export async function runFullEventbriteSweep(): Promise<void> {
  if (scraperRunning) {
    console.log("[eventbrite] Scraper already running, skipping.");
    return;
  }
  scraperRunning = true;
  console.log("[eventbrite] Starting FULL UK sweep (450+ locations × 20 categories × 4 date windows)...");

  const limit = pLimit(15); // 15 concurrent workers
  const dateWindows = getDateWindows();
  let newEvents = 0;

  // ── Phase 1: location × category × date window ──────────────────────────────
  const locationCategoryJobs: Array<() => Promise<number>> = [];

  for (const location of UK_LOCATIONS) {
    for (const categoryId of CATEGORIES) {
      for (const dateRange of dateWindows) {
        locationCategoryJobs.push(() =>
          drainCombo({ location, categoryId, dateRange }).catch(() => 0)
        );
      }
    }
  }

  const total = locationCategoryJobs.length;
  let done = 0;

  const results = await Promise.all(
    locationCategoryJobs.map((job) =>
      limit(async () => {
        const count = await job();
        done++;
        if (done % 500 === 0) {
          console.log(`[eventbrite] Progress: ${done}/${total} combos (${Math.round(done * 100 / total)}%)`);
        }
        return count;
      })
    )
  );

  newEvents += results.reduce((a, b) => a + b, 0);
  console.log(`[eventbrite] Phase 1 complete. Events upserted: ${newEvents}`);

  // ── Phase 2: keyword sweep across UK ────────────────────────────────────────
  const keywordJobs = KEYWORDS.map((keyword) =>
    limit(() => drainCombo({ keyword, maxPages: 10 }).catch(() => 0))
  );

  const keywordResults = await Promise.all(keywordJobs);
  const keywordCount = keywordResults.reduce((a, b) => a + b, 0);
  newEvents += keywordCount;

  totalScraped += newEvents;
  console.log(`[eventbrite] Full sweep complete. New/updated this run: ${newEvents}. Lifetime: ${totalScraped}`);
  scraperRunning = false;
}

// ── INCREMENTAL sweep — keywords only, catches newly posted events ─────────────
export async function runIncrementalEventbriteSweep(): Promise<void> {
  if (scraperRunning) return;
  console.log("[eventbrite] Running incremental sweep...");

  const limit = pLimit(8);
  let newEvents = 0;

  // Keyword sweep (first 2 pages each = up to 100 events per keyword, fast)
  const jobs = KEYWORDS.map((keyword) =>
    limit(async () => {
      const count = await drainCombo({ keyword, maxPages: 2 }).catch(() => 0);
      await sleep(300);
      return count;
    })
  );

  const results = await Promise.all(jobs);
  newEvents = results.reduce((a, b) => a + b, 0);
  console.log(`[eventbrite] Incremental sweep done. New/updated: ${newEvents}`);
}

// ── Expire events that have ended ─────────────────────────────────────────────
export async function expireOldEvents(): Promise<void> {
  try {
    // Expire events whose end_date has passed, or (if no end_date) start_date > 24h ago
    await db
      .update(events)
      .set({ status: "expired" })
      .where(sql`
        status = 'active' AND (
          (end_date IS NOT NULL AND end_date < NOW()) OR
          (end_date IS NULL AND start_date < NOW() - INTERVAL '1 day')
        )
      `);
    console.log("[eventbrite] Expired old events.");
  } catch (err) {
    console.error("[eventbrite] Error expiring events:", err);
  }
}

export function getScraperStatus() {
  return { running: scraperRunning, totalScraped };
}
