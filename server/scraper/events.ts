/**
 * Multi-source UK events scraper.
 * Sources: Meetup (GraphQL API), Luma (HTML __NEXT_DATA__).
 * Replaces the Eventbrite scraper which is blocked by AWS WAF on cloud IPs.
 *
 * Uses the `eventbriteId` column as a universal source ID with prefix format:
 *   meetup:{eventId}
 *   luma:{eventId}
 */

import { db } from "../db";
import { events } from "../../shared/schema";
import { sql } from "drizzle-orm";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── UK city coordinates (for Meetup radius search) ─────────────────────────────
export const UK_CITIES = [
  { name: "london", lat: 51.509865, lon: -0.118092 },
  { name: "manchester", lat: 53.480759, lon: -2.242631 },
  { name: "birmingham", lat: 52.486243, lon: -1.890401 },
  { name: "edinburgh", lat: 55.953252, lon: -3.188267 },
  { name: "glasgow", lat: 55.864237, lon: -4.251806 },
  { name: "bristol", lat: 51.454514, lon: -2.58791 },
  { name: "leeds", lat: 53.800755, lon: -1.549077 },
  { name: "liverpool", lat: 53.408371, lon: -2.991573 },
  { name: "sheffield", lat: 53.381129, lon: -1.470085 },
  { name: "cardiff", lat: 51.481583, lon: -3.17909 },
  { name: "newcastle", lat: 54.978252, lon: -1.61778 },
  { name: "nottingham", lat: 52.954783, lon: -1.158109 },
  { name: "oxford", lat: 51.752022, lon: -1.257677 },
  { name: "cambridge", lat: 52.205338, lon: 0.121817 },
  { name: "reading", lat: 51.454265, lon: -0.97813 },
  { name: "brighton", lat: 50.82838, lon: -0.138811 },
  { name: "leicester", lat: 52.636879, lon: -1.139759 },
  { name: "coventry", lat: 52.406822, lon: -1.519693 },
  { name: "southampton", lat: 50.909698, lon: -1.404351 },
  { name: "belfast", lat: 54.607868, lon: -5.926437 },
];

// ── Keywords for Meetup search ─────────────────────────────────────────────────
export const MEETUP_KEYWORDS = [
  "networking",
  "tech",
  "startup",
  "business",
  "career",
  "entrepreneurship",
  "ai",
  "fintech",
  "marketing",
  "design",
];

// ── Common fetch headers (browser-like) ───────────────────────────────────────
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-GB,en;q=0.9",
};

// ── Upsert a normalised event record ──────────────────────────────────────────
async function upsertEvent(record: {
  sourceId: string; // e.g. "meetup:123"
  title: string;
  description?: string;
  category?: string;
  locationCity?: string;
  locationPostcode?: string;
  locationVenue?: string;
  locationAddress?: string;
  lat?: string | null;
  lng?: string | null;
  startDate: Date;
  endDate?: Date | null;
  url?: string;
  organizerName?: string;
  isFree?: boolean;
  isOnline?: boolean;
  thumbnailUrl?: string;
}): Promise<boolean> {
  if (!record.title || !record.sourceId) return false;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (record.startDate < cutoff) return false;

  try {
    await db
      .insert(events)
      .values({
        eventbriteId: record.sourceId, // repurposed as universal source ID
        title: record.title.slice(0, 500),
        description: (record.description ?? "").slice(0, 5000),
        category: record.category ?? "Other",
        locationCity: record.locationCity ?? "",
        locationPostcode: record.locationPostcode ?? "",
        locationVenue: record.locationVenue ?? "",
        locationAddress: record.locationAddress ?? "",
        lat: record.lat ?? null,
        lng: record.lng ?? null,
        startDate: record.startDate,
        endDate: record.endDate ?? null,
        url: record.url ?? "",
        organizerName: record.organizerName ?? "",
        isFree: record.isFree ?? false,
        isOnline: record.isOnline ?? false,
        thumbnailUrl: record.thumbnailUrl ?? "",
        status: "active",
        scrapedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: events.eventbriteId,
        set: {
          title: record.title.slice(0, 500),
          description: (record.description ?? "").slice(0, 5000),
          startDate: record.startDate,
          endDate: record.endDate ?? null,
          status: "active",
          scrapedAt: new Date(),
        },
      });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEETUP SCRAPER
// ═══════════════════════════════════════════════════════════════════════════════

const MEETUP_GQL = `
query SearchEvents($query: String!, $lat: Float!, $lon: Float!, $radius: Float!, $after: String) {
  keywordSearch(filter: {
    query: $query
    lat: $lat
    lon: $lon
    radius: $radius
    source: EVENTS
    first: 50
    after: $after
  }) {
    pageInfo { hasNextPage endCursor }
    edges {
      node {
        id
        ... on Event {
          id
          title
          dateTime
          endTime
          description
          eventUrl
          isFree
          isOnline
          venue { name city lat lng address }
          group { name }
          images { baseUrl }
        }
      }
    }
  }
}
`;

interface MeetupEvent {
  id?: string;
  title?: string;
  dateTime?: string;
  endTime?: string;
  description?: string;
  eventUrl?: string;
  isFree?: boolean;
  isOnline?: boolean;
  venue?: { name?: string; city?: string; lat?: number; lng?: number; address?: string };
  group?: { name?: string };
  images?: Array<{ baseUrl?: string }>;
}

export async function drainMeetupCity(params: {
  lat: number;
  lon: number;
  city: string;
  keyword: string;
  maxPages?: number;
}): Promise<number> {
  let upserted = 0;
  let cursor: string | null = null;
  const maxPages = params.maxPages ?? 4; // up to 200 events per keyword per city

  for (let page = 0; page < maxPages; page++) {
    try {
      const gqlBody: string = JSON.stringify({
        query: MEETUP_GQL,
        variables: {
          query: params.keyword,
          lat: params.lat,
          lon: params.lon,
          radius: 40, // 40 miles radius
          ...(cursor ? { after: cursor } : {}),
        },
      });

      const gqlResp: Response = await fetch("https://api.meetup.com/gql", {
        method: "POST",
        headers: { ...HEADERS, "Content-Type": "application/json" },
        body: gqlBody,
        signal: AbortSignal.timeout(20000),
      });

      if (!gqlResp.ok) {
        // If GraphQL API fails, fall back to HTML parsing
        if (page === 0) {
          upserted += await drainMeetupHtml(params);
        }
        break;
      }

      const gqlData: { data?: { keywordSearch?: any } } = await gqlResp.json();
      const search: any = gqlData?.data?.keywordSearch;
      if (!search) break;

      const edges: Array<{ node: MeetupEvent }> = search?.edges ?? [];
      for (const { node: evt } of edges) {
        if (!evt?.id || !evt?.title || !evt?.dateTime) continue;
        const startDate = new Date(evt.dateTime);
        const ok = await upsertEvent({
          sourceId: `meetup:${evt.id}`,
          title: evt.title,
          description: (evt.description ?? "").replace(/<[^>]*>/g, ""),
          category: "Business & Professional",
          locationCity: evt.venue?.city ?? params.city,
          locationVenue: evt.venue?.name ?? "",
          locationAddress: evt.venue?.address ?? "",
          lat: evt.venue?.lat != null ? String(evt.venue.lat) : null,
          lng: evt.venue?.lng != null ? String(evt.venue.lng) : null,
          startDate,
          endDate: evt.endTime ? new Date(evt.endTime) : null,
          url: evt.eventUrl ?? "",
          organizerName: evt.group?.name ?? "",
          isFree: evt.isFree ?? false,
          isOnline: evt.isOnline ?? false,
          thumbnailUrl: evt.images?.[0]?.baseUrl ?? "",
        });
        if (ok) upserted++;
      }

      const pageInfo: { hasNextPage?: boolean; endCursor?: string } = search?.pageInfo;
      if (!pageInfo?.hasNextPage) break;
      cursor = pageInfo.endCursor ?? null;
      if (!cursor) break;

      await sleep(800);
    } catch (err) {
      console.warn(`[events/meetup] ${params.city}/${params.keyword} page ${page} error:`, (err as Error).message);
      break;
    }
  }

  return upserted;
}

// ── HTML fallback: parse Meetup search page __APOLLO_STATE__ ──────────────────
async function drainMeetupHtml(params: {
  lat: number;
  lon: number;
  city: string;
  keyword: string;
}): Promise<number> {
  const url = `https://www.meetup.com/find/?eventType=inPerson&location=${encodeURIComponent(params.city)}+UK&keywords=${encodeURIComponent(params.keyword)}`;
  try {
    const resp = await fetch(url, {
      headers: { ...HEADERS, Accept: "text/html" },
      signal: AbortSignal.timeout(20000),
    });
    if (!resp.ok) return 0;
    const html = await resp.text();

    // Apollo state is embedded inside __NEXT_DATA__ > props > pageProps > __APOLLO_STATE__
    const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (!nextMatch) return 0;

    let upserted = 0;
    try {
      const nextData = JSON.parse(nextMatch[1]);
      const pageProps = nextData?.props?.pageProps ?? {};
      const apolloState: Record<string, any> = pageProps.__APOLLO_STATE__ ?? {};

      for (const [key, val] of Object.entries(apolloState)) {
        if (!key.startsWith("Event:")) continue;
        const evt = val as any;
        if (!evt.title || !evt.dateTime) continue;

        // Resolve venue ref if needed
        let venue: any = evt.venue;
        if (venue?.__ref) venue = apolloState[venue.__ref] ?? {};

        const ok = await upsertEvent({
          sourceId: `meetup:${evt.id ?? key.replace("Event:", "")}`,
          title: evt.title,
          description: (evt.description ?? "").replace(/\*\*|\\./g, "").trim(),
          category: "Business & Professional",
          locationCity: venue?.city ?? params.city,
          locationVenue: venue?.name ?? "",
          locationAddress: venue?.address ?? "",
          lat: venue?.lat != null ? String(venue.lat) : null,
          lng: venue?.lng != null ? String(venue.lng) : null,
          startDate: new Date(evt.dateTime),
          endDate: evt.endTime ? new Date(evt.endTime) : null,
          url: evt.eventUrl ?? "",
          organizerName: (apolloState[evt.group?.__ref ?? ""] as any)?.name ?? "",
          isFree: evt.feeSettings?.type === "free" || !evt.feeSettings,
          isOnline: evt.eventType === "online",
          thumbnailUrl: (apolloState[evt.featuredEventPhoto?.__ref ?? ""] as any)?.baseUrl
            ?? (apolloState[evt.displayPhoto?.__ref ?? ""] as any)?.baseUrl ?? "",
        });
        if (ok) upserted++;
      }
    } catch (e) {
      console.warn("[events/meetup-html] Parse error:", (e as Error).message);
    }

    return upserted;
  } catch {
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LUMA SCRAPER
// ═══════════════════════════════════════════════════════════════════════════════

const LUMA_CITY_SLUGS: Record<string, string> = {
  london: "london",
  manchester: "manchester",
  birmingham: "birmingham",
  edinburgh: "edinburgh",
  glasgow: "glasgow",
  bristol: "bristol",
  leeds: "leeds",
  liverpool: "liverpool",
  newcastle: "newcastle",
  cambridge: "cambridge",
  oxford: "oxford",
};

export async function drainLumaCity(city: string): Promise<number> {
  let upserted = 0;

  // Try Luma API first
  upserted += await drainLumaApi(city);

  // Also try city page HTML
  const slug = LUMA_CITY_SLUGS[city.toLowerCase()] ?? city.toLowerCase();
  upserted += await drainLumaHtml(slug, city);

  return upserted;
}

async function drainLumaApi(city: string): Promise<number> {
  // Luma public discover API
  const endpoints = [
    `https://api.lu.ma/public/v1/calendar/list-events?pagination_limit=50`,
    `https://api.lu.ma/discover/get-popular-events?period=future&geo=${encodeURIComponent(city)}&pagination_limit=50`,
  ];

  let upserted = 0;

  for (const url of endpoints) {
    try {
      const resp = await fetch(url, {
        headers: { ...HEADERS, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) continue;
      const data = await resp.json();

      // Try various response shapes
      const eventsList: any[] =
        data?.events ??
        data?.entries?.map((e: any) => e.event) ??
        data?.data?.events ??
        [];

      for (const evt of eventsList) {
        if (!evt?.api_id && !evt?.id) continue;
        const id = evt.api_id ?? evt.id;
        const startDate = evt.start_at ?? evt.starts_at ?? evt.dateTime;
        if (!startDate || !evt.name && !evt.title) continue;

        const ok = await upsertEvent({
          sourceId: `luma:${id}`,
          title: (evt.name ?? evt.title ?? "").slice(0, 500),
          description: (evt.description ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
          category: "Business & Professional",
          locationCity: evt.geo_address_info?.city ?? evt.location?.city ?? city,
          locationAddress: evt.geo_address_info?.full_address ?? evt.location?.address ?? "",
          lat: evt.lat != null ? String(evt.lat) : null,
          lng: evt.lng != null ? String(evt.lng) : null,
          startDate: new Date(startDate),
          endDate: evt.end_at ?? evt.ends_at ? new Date(evt.end_at ?? evt.ends_at) : null,
          url: `https://lu.ma/${evt.url ?? evt.slug ?? id}`,
          organizerName: evt.calendar?.name ?? evt.host?.name ?? "",
          isFree: evt.ticket_info?.is_free ?? evt.price == null ?? false,
          isOnline: evt.event_type === "online" || false,
          thumbnailUrl: evt.cover_url ?? evt.thumbnail_url ?? "",
        });
        if (ok) upserted++;
      }

      if (upserted > 0) break; // stop after first successful endpoint
    } catch { /* try next */ }
  }

  return upserted;
}

async function drainLumaHtml(slug: string, city: string): Promise<number> {
  const urls = [
    `https://lu.ma/${slug}`,
    `https://lu.ma/city/${slug}`,
  ];

  let upserted = 0;

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: { ...HEADERS, Accept: "text/html" },
        signal: AbortSignal.timeout(20000),
      });
      if (!resp.ok) continue;
      const html = await resp.text();

      const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
      if (!nextMatch) continue;

      const nextData = JSON.parse(nextMatch[1]);
      const pageProps = nextData?.props?.pageProps ?? {};

      // Luma stores events under data.events or initialData.events
      const eventsList: any[] =
        pageProps?.data?.events ??
        pageProps?.initialData?.events ??
        pageProps?.events ??
        extractEventsFromObject(pageProps);

      for (const entry of eventsList) {
        const evt = entry?.event ?? entry;
        if (!evt) continue;
        const id = evt.api_id ?? evt.id;
        const startDate = evt.start_at ?? evt.starts_at;
        if (!id || !startDate || !evt.name) continue;

        const ok = await upsertEvent({
          sourceId: `luma:${id}`,
          title: (evt.name ?? "").slice(0, 500),
          description: (evt.description ?? "").replace(/<[^>]*>/g, "").slice(0, 5000),
          category: "Business & Professional",
          locationCity: evt.geo_address_info?.city ?? city,
          locationAddress: evt.geo_address_info?.full_address ?? "",
          startDate: new Date(startDate),
          endDate: evt.end_at ? new Date(evt.end_at) : null,
          url: `https://lu.ma/${evt.url ?? evt.slug ?? id}`,
          organizerName: evt.calendar?.name ?? "",
          isFree: entry?.ticket_info?.is_free ?? evt.ticket_info?.is_free ?? true,
          isOnline: evt.event_type === "online" || false,
          thumbnailUrl: evt.cover_url ?? "",
        });
        if (ok) upserted++;
      }

      if (upserted > 0) break;
      await sleep(1000);
    } catch { /* try next */ }
  }

  return upserted;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Walk a JSON object and collect arrays that look like event lists */
function extractEventsFromObject(obj: any, depth = 0): any[] {
  if (depth > 8 || !obj || typeof obj !== "object") return [];

  if (Array.isArray(obj)) {
    // If it looks like a list of events, return it
    if (obj.length > 0 && (obj[0]?.id || obj[0]?.api_id) && (obj[0]?.title || obj[0]?.name || obj[0]?.dateTime)) {
      return obj;
    }
    for (const item of obj) {
      const found = extractEventsFromObject(item, depth + 1);
      if (found.length > 0) return found;
    }
    return [];
  }

  for (const key of ["events", "edges", "results", "items", "data"]) {
    if (obj[key]) {
      const found = extractEventsFromObject(obj[key], depth + 1);
      if (found.length > 0) return found;
    }
  }

  for (const val of Object.values(obj)) {
    const found = extractEventsFromObject(val, depth + 1);
    if (found.length > 0) return found;
  }

  return [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL SWEEP (used by scheduler)
// ═══════════════════════════════════════════════════════════════════════════════

let sweepRunning = false;

export async function runFullEventSweep(): Promise<void> {
  if (sweepRunning) {
    console.log("[events] Sweep already running, skipping.");
    return;
  }
  sweepRunning = true;

  try {
    // Try BullMQ queue first (preferred when Redis is available)
    const { enqueueEventSweep } = await import("../queue/eventQueue.js");
    const count = await enqueueEventSweep(UK_CITIES, MEETUP_KEYWORDS);
    console.log(`[events] Full sweep enqueued ${count} jobs via BullMQ`);
  } catch (err) {
    // Redis unavailable — fall back to inline p-limit sweep
    console.warn("[events] BullMQ unavailable, running inline sweep:", (err as Error).message);
    await runInlineSweep();
  } finally {
    sweepRunning = false;
  }
}

async function runInlineSweep(): Promise<void> {
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(8);

  const tasks: Array<() => Promise<number>> = [];

  for (const city of UK_CITIES) {
    tasks.push(() => drainLumaCity(city.name).catch(() => 0));
    for (const kw of MEETUP_KEYWORDS) {
      tasks.push(() => drainMeetupCity({ lat: city.lat, lon: city.lon, city: city.name, keyword: kw }).catch(() => 0));
    }
  }

  let done = 0;
  const results = await Promise.all(
    tasks.map((t) =>
      limit(async () => {
        const n = await t();
        done++;
        if (done % 20 === 0) console.log(`[events] Inline sweep: ${done}/${tasks.length}`);
        return n;
      })
    )
  );

  const total = results.reduce((a, b) => a + b, 0);
  console.log(`[events] Inline sweep complete. Upserted: ${total}`);
}

export async function runIncrementalEventSweep(): Promise<void> {
  // Quick sweep — top cities with primary keyword only
  const topCities = UK_CITIES.slice(0, 5);
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(5);

  const tasks = topCities.flatMap((city) =>
    ["networking", "tech", "startup"].map((kw) =>
      limit(() => drainMeetupCity({ lat: city.lat, lon: city.lon, city: city.name, keyword: kw, maxPages: 2 }).catch(() => 0))
    )
  );

  const results = await Promise.all(tasks);
  const total = results.reduce((a, b) => a + b, 0);
  console.log(`[events] Incremental sweep done. Upserted: ${total}`);
}

// ── Expire events whose end date (or start date + 1 day) has passed ───────────
export async function expireOldEvents(): Promise<void> {
  try {
    await db
      .update(events)
      .set({ status: "expired" })
      .where(
        sql`
          status = 'active' AND (
            (end_date IS NOT NULL AND end_date < NOW()) OR
            (end_date IS NULL AND start_date < NOW() - INTERVAL '1 day')
          )
        `
      );
    console.log("[events] Expired old events.");
  } catch (err) {
    console.error("[events] Error expiring events:", err);
  }
}
