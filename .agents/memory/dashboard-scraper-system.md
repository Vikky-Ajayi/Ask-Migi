---
name: Dashboard & scraper system
description: Architecture, schema field names, API routes, and known TS quirks for the career dashboard + job/event scraper features.
---

## Schema field names (critical — easy to get wrong)
- `userProfiles.jobTitle` — NOT `currentTitle`
- `userProfiles.workTypes` — array, NOT `workType`
- `userProfiles.locationPostcode` — NOT `locationCountry`
- `jobs` table has NO `tags` field; match on `title + company + description` only
- `events.lat` / `events.lng` — `decimal` type in Drizzle, stores as string in JS; pass raw string from Eventbrite (no parseFloat)
- `userProfiles.skills` — text array, always present (default [])

## API routes added (all under /api/dashboard/*)
- GET /stats — coins, profileComplete, totalApplications, pendingApplications, totalEvents, totalJobs
- GET/POST /profile — get/upsert career profile
- POST /profile/cv — multer upload (PDF/DOCX/TXT), parses with pdf-parse/mammoth, AI extracts skills+jobTitle via Groq
- GET /events — paginated, filters: q, category, city, online, free
- POST /events/match — costs 2 coins, keyword-scores events vs profile, returns topIds[]
- GET /jobs — paginated, filters: q, source, workType, remote, ids (comma-sep)
- POST /jobs/match — costs 1 coin, keyword-scores jobs vs profile, returns topIds[]
- POST /jobs/apply — costs 5 coins/job, queues applications, deduplicates, fires processQueuedApplications()
- GET /applications — user's applications enriched with job data
- PATCH /applications/:id/status — manual status update

## AuthRequest pattern
Defined as `interface AuthRequest extends Request { userId?: string; }` at top of routes.ts.
requireAuth middleware sets `(req as any).userId`. Dashboard routes type as `req: AuthRequest`.

## Known pre-existing TS errors (safe to ignore)
Lines ~217, 307, 311, 392, 397, 813 in routes.ts: `string | string[]` vs `string` on req.params.id in old routes. These predate the dashboard and don't affect tsx runtime.

## pdf-parse import
Import as: `const pdfModule = await import("pdf-parse"); const pdfParse = (pdfModule as any).default ?? pdfModule;`
The ESM build doesn't expose `.default` on the type but does at runtime.

## Coins gating
- Events match: 2 coins
- Jobs match: 1 coin  
- Per job auto-apply: 5 coins
- All gating checks `user.unlimitedCoins` first

## Auto-apply queue
processQueuedApplications() called: on startup (15s delay), every 2 min interval, and immediately on each /jobs/apply request.
Phase 2 (Playwright form-fill) is a TODO stub — Phase 1 only generates tailored CV summary + cover letter via Groq.

## buildProfileText (embeddings.ts)
Uses `profile.jobTitle` (not currentTitle). Fields: industry, jobTitle, skills[], cvText (first 2000 chars).

**Why:** keywordScore() is the fallback when OPENAI_API_KEY not set; OpenAI text-embedding-3-small used when set.

## Map/Set/RegExpStringIterator iteration
Must use Array.from() instead of for...of on Map, Set, and matchAll() results — tsconfig targets ES2014 and downlevelIteration is not set.
