# Ask Migi — Feature Plan
## Dashboard + UK Networking Events + AI Auto Job Applier

> **Status:** Planning only — no code written yet.
> **Date:** July 2026

---

## Overview

Three interconnected features built on top of a new **User Dashboard**:

| # | Feature | Summary |
|---|---------|---------|
| 0 | **User Dashboard** | Central hub replacing the current scattered page structure |
| 1 | **UK Networking Events** | Scrape 90%+ of UK Eventbrite events, match to user's industry/location |
| 2 | **AI Auto Job Applier** | Scrape global job boards, AI-match, auto-apply server-side via browser automation |

Both features are **coin-gated** and live inside the dashboard.

---

## 0. User Dashboard

### What It Is
A `/dashboard` route and sidebar layout that houses all user-facing features in one place. The current page structure (enquiries, buy-coins, experts) remains accessible but the dashboard becomes the post-login home.

### Dashboard Sections
```
/dashboard               → Overview cards (coins, recent events, active applications)
/dashboard/profile       → CV upload + career profile builder
/dashboard/events        → UK networking events feed
/dashboard/jobs          → AI job matches feed
/dashboard/applications  → Application tracker (status of every auto-apply)
/dashboard/settings      → Account settings (formerly /settings)
```

### Design
- Follows existing `th-*` CSS token system and Roobert font
- Sidebar nav on desktop, bottom nav on mobile
- Dark/light theme toggle carries through from existing ThemeContext
- Overview cards: coins balance, events matched this week, applications sent, interviews scheduled

### New DB Tables (Dashboard-level)
```sql
user_profiles
  user_id          TEXT PRIMARY KEY (FK → users.id)
  industry         TEXT
  job_title        TEXT
  years_experience INT
  skills           TEXT[]
  cv_text          TEXT          -- parsed plain text of uploaded CV
  cv_filename      TEXT
  location_city    TEXT
  location_postcode TEXT
  linkedin_url     TEXT
  salary_min       INT
  salary_max       INT
  work_types       TEXT[]        -- ['remote','hybrid','onsite']
  created_at       TIMESTAMP
  updated_at       TIMESTAMP
```

---

## 1. UK Networking Events

### Goal
Maintain a live database of ≥90% of all publicly listed UK events on Eventbrite at any point in time, matched to a user's industry and location, surfaced as networking opportunities.

### Scraping Strategy — No API Key

Eventbrite shut down their free public search API in 2019. However, their **internal web app endpoint** is publicly callable:

```
GET https://www.eventbrite.com/api/v3/destination/search/
  ?place_atlas_id={location_id}
  &categories={category_ids}
  &page={n}
  &page_size=50
  &dates=current_future
  &expand=event_sales_status,primary_venue,image
```

This is the same endpoint Eventbrite's own website calls — no API key required, responses are JSON. Combined with:

- **Location enumeration**: Every UK city, town, and postcode district (we use a comprehensive list of ~400 UK localities)
- **Category enumeration**: All 20 Eventbrite categories (Business & Professional, Science & Tech, Music, Food & Drink, Arts, Health & Wellness, Sports, Community, etc.)
- **Keyword sweeps**: "networking", "conference", "summit", "workshop", "seminar", "meetup", "pitch", "hackathon" — sweeping by industry keyword catches events that are miscategorised
- **Date windows**: Scrape future events (rolling 12 months forward) + recently past (30 days back, to ensure newly published events aren't missed)

### Worker Architecture

```
Scheduler (node-cron)
  ├── FULL_SWEEP    — every 6 hours: enumerate all locations × categories
  ├── INCREMENTAL   — every 30 min: check for new events added since last run
  └── CLEANUP       — daily: mark expired/cancelled events

BullMQ Queue (Redis-backed)
  ├── scrape-location-category  (high concurrency: 15 parallel workers)
  └── parse-and-upsert          (10 workers: deduplicate, embed, store)

Each worker:
  - Rotates User-Agent strings
  - Respects 1 req/sec per worker (150 req/min total at 15 workers)
  - Handles 429s with exponential backoff
  - Deduplicates by Eventbrite event ID before writing
```

### Scale Reality Check

> **Important context:** Eventbrite's ~1M total events is their global figure. UK-specific events are a subset. Based on Eventbrite's UK market share and the density of UK events, a realistic estimate of the active UK corpus is **100,000–400,000 events** at any given time (including online events listed as UK, free events, small local events).

**The 90% target is still the goal** — it means our enumeration strategy must be exhaustive enough that we're not missing whole categories or regions, not that we're targeting 900k absolute events. If Eventbrite UK has 300k events, we target 270k+.

The sweep strategy (400 locations × 20 categories × date windows × keyword sweeps) provides this coverage in theory. First full sweep is estimated to take 8–16 hours. After that, incremental runs keep it current.

### Database Schema

```sql
events
  id               UUID PRIMARY KEY
  eventbrite_id    TEXT UNIQUE NOT NULL    -- deduplication key
  title            TEXT NOT NULL
  description      TEXT
  category         TEXT                    -- Eventbrite category name
  tags             TEXT[]
  location_city    TEXT
  location_postcode TEXT
  location_venue   TEXT
  location_address TEXT
  lat              DECIMAL(10,6)
  lng              DECIMAL(10,6)
  start_date       TIMESTAMP NOT NULL
  end_date         TIMESTAMP
  url              TEXT
  organizer_name   TEXT
  price_min        DECIMAL(10,2)
  price_max        DECIMAL(10,2)
  is_free          BOOLEAN
  is_online        BOOLEAN
  thumbnail_url    TEXT
  embedding        VECTOR(1536)            -- OpenAI text-embedding-3-small
  scraped_at       TIMESTAMP
  updated_at       TIMESTAMP
  status           TEXT DEFAULT 'active'   -- active | cancelled | expired

-- Indexes required:
CREATE INDEX ON events USING GIN(tags);
CREATE INDEX ON events (start_date) WHERE status = 'active';
CREATE INDEX ON events (location_city);
CREATE INDEX ON events USING ivfflat (embedding vector_cosine_ops); -- pgvector
CREATE INDEX ON events USING GIN(to_tsvector('english', title || ' ' || description)); -- full-text
```

### Infrastructure Requirements (Railway Postgres)

| Metric | Estimate |
|--------|----------|
| Events at 300k corpus | ~1.5 GB data |
| Embeddings (1536 dims × 300k) | ~1.8 GB |
| Indexes (GIN, BRIN, ivfflat) | ~0.8 GB |
| **Total DB footprint** | **~4–5 GB** |
| Redis (BullMQ queues) | ~200 MB |

Railway's paid Postgres plan handles this comfortably. You'll want:
- **pgvector extension** enabled (Railway supports it)
- **Redis add-on** for BullMQ (or use Railway's Redis service)
- Consider a dedicated **worker service** on Railway separate from the web server

### User-Facing Feature: Event Discovery Page (`/dashboard/events`)

**Flow:**
1. User opens `/dashboard/profile` → enters: industry, job title, skills, UK location (city/postcode selector with autocomplete of all UK cities)
2. System generates a profile embedding from their CV text + industry + skills
3. `/dashboard/events` shows events ranked by:
   - Semantic similarity (embedding cosine distance, profile vs event description)
   - Location radius filter (user's postcode → event postcode, within X miles they set)
   - Date filter (upcoming only by default)
4. Each event card shows: title, date, venue, category tags, free/paid badge, link to Eventbrite

**Coins:** Browsing the events page is **free**. "Get personalised matches" (runs the embedding similarity search with their profile) costs **2 coins**.

---

## 2. AI Auto Job Applier

### Reference: AIApply.co Architecture

From research, AIApply's model is:
- **Profile-first**: user uploads CV → GPT-4 parses it into structured profile
- **Aggregated job board**: they scrape LinkedIn, Indeed, Glassdoor, Reed etc. into their own DB
- **AI matching**: vector similarity between user profile and job descriptions
- **Auto-apply**: server-side Playwright/Puppeteer automation that fills application forms on job boards on behalf of users
- **Document generation**: per-application tailored CV + cover letter via GPT-4
- **Tracking**: full application status pipeline

Our version follows this exact architecture with global scope.

### Job Sourcing — Global, No API Keys

**Tier 1 — Structured/Easy (JSON feeds or guest endpoints):**

| Source | Method | Notes |
|--------|--------|-------|
| LinkedIn | `linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/` — public guest endpoint, no login | Largest global job board |
| Reed.co.uk | Free public API (reed.co.uk/api — they do have a free tier) | UK's #1 board |
| Remotive | `remotive.com/api/remote-jobs` — open JSON API | Remote tech jobs |
| WeWorkRemotely | RSS feed + HTML | Remote jobs |
| Greenhouse.io | `boards.greenhouse.io/{company}/jobs` — public API | Top ATS, many companies |
| Lever.co | `jobs.lever.co/{company}` — public JSON API | Top ATS |
| Workable | Public job listings API | Top ATS |
| Himalayas | Open JSON API | Remote jobs |

**Tier 2 — Scraping (Playwright):**
| Source | Volume |
|--------|--------|
| Indeed (UK + global) | Massive, needs careful rate limiting |
| Glassdoor | Large, needs rotation |
| Totaljobs | UK focused |
| CV-Library | UK focused |
| Monster | Global |
| ZipRecruiter | US/global |

**JobSpy** (open-source Python library, 3.7k GitHub stars) covers LinkedIn, Indeed, Glassdoor, Google Jobs, ZipRecruiter in one library — we can run it as a Python microservice or port the scraping logic to Node.

### Worker Architecture

```
Job Ingestion Pipeline
  ├── Source workers (1 per job board, run on cron)
  │     Every 2 hours: fetch new listings since last run
  │     Full rescan: every 24 hours
  ├── Deduplication: hash(title + company + location)
  ├── Enrichment worker: generate embedding for each job description
  └── Expiry worker: mark jobs older than 60 days as expired

Application Pipeline (BullMQ)
  ├── Queue: application-jobs
  ├── Worker: Playwright automation (headless Chromium)
  │     Detects ATS type → runs appropriate form-fill strategy
  │     Uploads tailored CV PDF
  │     Submits form
  │     Records outcome
  └── Notifier: updates application status in DB, notifies user
```

### DB Schema

```sql
jobs
  id                UUID PRIMARY KEY
  source            TEXT                  -- 'linkedin' | 'reed' | 'indeed' | etc.
  source_id         TEXT                  -- job ID on source platform
  source_url        TEXT UNIQUE NOT NULL
  apply_url         TEXT
  ats_type          TEXT                  -- 'greenhouse' | 'lever' | 'workable' | 'linkedin_easy' | 'indeed_easy' | 'direct'
  title             TEXT NOT NULL
  company           TEXT NOT NULL
  location          TEXT
  is_remote         BOOLEAN
  work_type         TEXT                  -- 'remote' | 'hybrid' | 'onsite'
  description       TEXT
  requirements      TEXT
  salary_min        INT
  salary_max        INT
  currency          TEXT
  contract_type     TEXT                  -- 'full_time' | 'part_time' | 'contract' | 'freelance'
  embedding         VECTOR(1536)
  posted_at         TIMESTAMP
  scraped_at        TIMESTAMP
  expires_at        TIMESTAMP
  status            TEXT DEFAULT 'active'

-- Indexes:
CREATE INDEX ON jobs (posted_at DESC) WHERE status = 'active';
CREATE INDEX ON jobs (ats_type) WHERE status = 'active';
CREATE INDEX ON jobs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON jobs USING GIN(to_tsvector('english', title || ' ' || description));

applications
  id               UUID PRIMARY KEY
  user_id          TEXT (FK → users.id)
  job_id           UUID (FK → jobs.id)
  status           TEXT     -- 'queued' | 'generating_docs' | 'applying' | 'submitted' | 'failed' | 'viewed' | 'interview' | 'rejected' | 'offer'
  tailored_cv_url  TEXT     -- stored PDF
  cover_letter     TEXT
  applied_at       TIMESTAMP
  status_updated_at TIMESTAMP
  failure_reason   TEXT
  coins_spent      INT
  notes            TEXT
```

### User-Facing Flow (`/dashboard/jobs`)

**Step 1: Profile Setup** (`/dashboard/profile`)
- Upload CV (PDF/DOCX) → GPT-4 parses it → auto-fills: job title, skills, years experience, industries
- User reviews and confirms, adds: target roles, salary range, work type preferences, locations willing to work in, deal-breakers
- Optional: link LinkedIn for richer profile

**Step 2: Job Matches** (`/dashboard/jobs`)
- Shows a ranked feed of jobs matched to their profile (embedding similarity)
- Filters: location, remote only, salary range, date posted, ATS type
- Each card shows: title, company, salary range, location, match score %, source badge
- User can: "Save for later", "Skip", or tick checkbox to select

**Step 3: Auto-Apply Queue**
- User selects 1–N jobs they want to apply for
- Confirms the auto-apply action (shows coin cost: **5 coins per application**, bundle discounts shown)
- System queues them → background Playwright workers run:
  1. GPT-4 generates a tailored version of their CV for this specific job description (highlights relevant skills/experience)
  2. GPT-4 generates a tailored cover letter
  3. Playwright navigates to the apply URL, detects form type, fills all fields, uploads documents, submits
  4. Status updated in real time

**Step 4: Application Tracker** (`/dashboard/applications`)
- Kanban-style or list view: Queued → Applying → Submitted → Viewed → Interview → Offer/Rejected
- Each row: company, role, date applied, source, AI match score, current status
- Manual status update (user gets an email interview request → can mark as "Interview")

### ATS Support Strategy (Priority Order)

1. **LinkedIn Easy Apply** — highest volume; Playwright clicks "Easy Apply", fills multi-step form with user data
2. **Greenhouse.io** — public `/applications` POST API; cleanest integration, no Playwright needed
3. **Lever.co** — public `POST /api/v0/apply/{requisitionId}` API; no Playwright needed
4. **Workable** — public apply API
5. **Indeed Easy Apply** — Playwright-based form fill
6. **Reed.co.uk** — Playwright fill or API if available
7. **Direct company pages** (Workday, ADP, Taleo etc.) — Playwright with form detection heuristics; lower success rate, flagged to user

### Coins Pricing (suggested)

| Action | Cost |
|--------|------|
| Browse job matches feed | Free |
| Run AI match against profile | 1 coin |
| Auto-apply to 1 job | 5 coins |
| Bundle: 5 auto-applies | 20 coins (save 20%) |
| Bundle: 20 auto-applies | 70 coins (save 30%) |
| CV parse + profile build | 2 coins (one-time) |

---

## Implementation Order

These three features have dependencies: the Dashboard shell must exist before the features can be built into it. Within features, the scraping infrastructure must exist before the matching/display layer.

### Recommended Build Order

```
Phase 1 — Dashboard Shell + Profile
  ├── Dashboard layout, sidebar, routing (/dashboard/*)
  ├── user_profiles table + CV upload + profile builder page
  └── pgvector + Redis setup on Railway

Phase 2 — Networking Events
  ├── events table schema + Drizzle migration
  ├── Eventbrite scraper workers (BullMQ + node-cron)
  ├── Initial bulk scrape (expect 8–16h to complete)
  ├── Embedding pipeline
  └── /dashboard/events UI with matching

Phase 3 — Job Applier (Infrastructure)
  ├── jobs + applications table schema
  ├── Job scraping workers (per source)
  ├── Embedding pipeline for jobs
  └── /dashboard/jobs feed UI with matching

Phase 4 — Auto-Apply Engine
  ├── Playwright worker setup (headless Chromium on Railway)
  ├── ATS adapters: Greenhouse, Lever, Workable (API-based, no Playwright)
  ├── ATS adapters: LinkedIn Easy Apply, Indeed Easy Apply (Playwright)
  ├── GPT-4 CV tailoring + cover letter generation
  └── /dashboard/applications tracker UI

Phase 5 — Coins Integration + Polish
  ├── Coin deduction hooks at each gate
  ├── Application status notifications
  └── Admin monitoring view for scraper health
```

---

## Infrastructure Summary

| Service | What For | Railway Setup |
|---------|----------|---------------|
| Existing Postgres | All existing data + new schemas | Already on Railway |
| pgvector extension | Vector embeddings for matching | `CREATE EXTENSION vector;` — 1 command |
| Redis | BullMQ job queues | Add Railway Redis add-on |
| Worker process | Scrapers + Playwright auto-apply | Second Railway service (same repo, `npm run worker`) |
| Headless Chromium | Playwright for auto-apply | Pre-installed in Playwright npm package |

**DB footprint estimate (both features at scale):**
- Events (300k): ~4–5 GB
- Jobs (500k–1M): ~6–10 GB
- Embeddings: biggest cost
- **Total: 10–20 GB** — Railway Pro Postgres handles this, but monitor and consider partitioning jobs table by `posted_at` if it grows beyond 1M rows.

---

## Open Questions / Risks

1. **Eventbrite rate limits**: Their internal endpoint has no published rate limit but they do block scrapers. Worker rotation, user-agent cycling, and backoff are required. If they start blocking aggressively, a proxy rotation service (Bright Data, Oxylabs) can be added.

2. **LinkedIn Terms of Service**: Scraping LinkedIn violates their ToS. This is the same position aiapply.co and every competitor is in — they operate anyway. Risk is IP bans (mitigated by proxies) not legal action for a platform of this scale.

3. **Auto-apply job board detection**: ATS form structures change. Greenhouse/Lever/Workable API integrations are reliable; Playwright-based adapters for LinkedIn/Indeed will need periodic maintenance.

4. **OpenAI costs for tailoring**: GPT-4 per application is ~$0.10–0.30/application at current pricing. At 5 coins/application (assuming coins have a value of pennies), this needs margin analysis. Alternative: use GPT-4o-mini for first pass, full GPT-4 only for top matches.

5. **UK event corpus size**: Actual UK Eventbrite corpus will become clear after first full sweep. Target remains ≥90% of whatever exists.
