---
name: Dashboard & scraper system
description: Full dashboard + job/event scraper system with AI matching. Schema field names, API shape, known quirks.
---

## AI Matching Flow (GPT-4o-mini)

**Jobs** (`POST /api/dashboard/jobs/match`, 1 coin):
1. Keyword pre-screen via `keywordScore` → top 80 from up to 5000 active jobs
2. `rankCandidatesWithAI(profileSummary, candidates, "job")` → GPT-4o-mini batch scoring (60/batch)
3. Top 30 IDs saved to `user_profiles.matched_job_ids`
4. `GET /api/dashboard/jobs?matched=true` reads stored IDs from profile

**Events** (`POST /api/dashboard/events/match`, 2 coins):
- Same pattern — top 80 pre-screen, AI re-rank, top 25 saved to `user_profiles.matched_event_ids`
- `GET /api/dashboard/events?matched=true` reads stored IDs

**AI utility** in `server/embeddings.ts`:
- `buildProfileSummary(profile)` → structured text for the AI prompt
- `rankCandidatesWithAI(summary, candidates, context)` → sorted `{id, score}[]`
- Falls back to keyword scoring if OPENAI_API_KEY is missing

## Stats endpoint shape (`GET /api/dashboard/stats`)

Returns: `{ coins, profileComplete, totalApplications, pendingApplications, matchedJobs, matchedEvents, recentJobs[3], recentEvents[3] }`

Dashboard cards read `matchedJobs` and `matchedEvents` (NOT `totalJobs`/`totalEvents`).
`recentJobs` and `recentEvents` populate the "Upcoming Events" and "Recent Job Matches" preview sections.

## Schema — user_profiles table

Added columns (after migrations):
- `matched_job_ids text[]` — persisted AI-matched job IDs for the user
- `matched_event_ids text[]` — persisted AI-matched event IDs for the user

**Why:** Matching results need to persist between page loads so the GET query can filter by them without re-running AI on every request. Stored per user in the profile row.

## Known issues / pre-existing

- Eventbrite scraper returns 0 events (API key / auth issue pre-dates this session)
- `checkout_id` column missing in `coin_purchases` table (SumUp reconciler logs error on startup — pre-existing)
- `job_applications` table may be missing until `drizzle-kit push` is run after deployment
