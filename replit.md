# Ask Migi — Career Platform

A fullstack TypeScript web app for career guidance, expert Q&A, job matching, and networking events.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Radix UI + Wouter (routing)
- **Backend**: Express 5 + TypeScript (tsx, ESM)
- **Database**: PostgreSQL via Drizzle ORM (`shared/schema.ts`)
- **AI**: OpenAI / Groq SDKs
- **Payments**: SumUp (card) + NowPayments (crypto)
- **Email**: Resend

## Running the app

```bash
npm run dev        # development server on port 5000
npm run build      # production build
npm run start      # serve production build
npm run db:push    # apply schema changes to the database
```

The workflow **Start application** runs `npm run dev` and serves on port 5000.

## Environment variables

### Required
- `DATABASE_URL` — PostgreSQL connection string (auto-provided by Replit)
- `SESSION_SECRET` — Secret for session signing

### Optional (features degrade gracefully without these)
- `OPENAI_API_KEY` — GPT-based AI features
- `GROQ_API_KEY` — Groq AI features
- `RESEND_API_KEY` — Transactional email via Resend
- `RESEND_FROM_EMAIL` — Sender address for emails
- `EXPERT_EMAIL` — Email address that receives expert enquiries
- `SITE_URL` — Public URL (e.g. https://askmigi.com)
- `SUMUP_API_KEY` — SumUp card payments
- `SUMUP_MERCHANT_EMAIL` — SumUp merchant account email
- `NOWPAYMENTS_API_KEY` — Crypto payments via NowPayments
- `ADMIN_SECRET` — Secret for admin-only API endpoints (e.g. POST /api/admin/set-coins)
- `TOKEN_SECRET` — JWT/token signing secret

## Project structure

```
client/         React frontend (src/)
server/         Express backend
  routes.ts     All API route registrations
  storage.ts    Data access layer (Drizzle + MemStorage fallback)
  ai.ts         AI integrations
  scraper/      Job & event scrapers + cron scheduler
shared/         Shared types and Drizzle schema
```

## User preferences

- Keep the existing dark/light theme system (ThemeContext + th-* CSS tokens)
- Maintain in-memory token auth (Bearer token in Authorization header, stored as `askmigi_token` in localStorage)
- Do not restructure the existing page/route layout without being asked
