---
name: Backend data model
description: MemStorage seed data, tables, and coin economics for Ask MiGi.
---

## Rule
Backend uses MemStorage (in-memory Maps, no real DB). Schema in `shared/schema.ts` is drizzle definitions used only for TypeScript types. Actual data lives in `server/storage.ts`.

## Seeded data
- Demo user: `demo@askmigi.com` / `demo123`, 50 coins
- 6 experts: 3 travel agents (Global Journeys Travel, Meridian Immigration Ltd., Pacific Gateway Travel), 2 immigration experts (Amara Osei, Elena Marchetti), 1 tour guide (City Explorers Tours).
- 3 enquiries for the demo user (1 answered with full text, 2 pending).

## Coin economics
- New user gets 5 welcome coins on register.
- Each question costs 3 coins (checked in POST /api/enquiries).
- Coin packs: 5 coins/$99.99, 12 coins/$199.99, 25 coins/$399.99.

## Password hashing
Uses Node's `pbkdf2Sync` with a random salt — no external bcrypt needed. Format: `salt:hash` stored in user.password.

## Why
Avoids external DB setup for demo. All data resets on server restart (in-memory).
