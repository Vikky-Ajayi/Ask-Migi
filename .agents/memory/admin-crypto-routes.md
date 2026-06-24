---
name: Admin & crypto payment routes
description: Admin coin allocation and NOWPayments crypto checkout endpoints added to routes.ts.
---

## Admin endpoint: POST /api/admin/set-coins
- No auth token required — protected by `ADMIN_SECRET` env var in request body
- Body: `{ secret, email, coins?, unlimited? }`
- Sets specific coin amount or toggles unlimitedCoins on the user
- Returns 503 if ADMIN_SECRET env is not set

**How to use:** POST to /api/admin/set-coins with `{ secret: "your-secret", email: "user@example.com", unlimited: true }` to grant unlimited coins to a user.

## Crypto endpoint: POST /api/coins/create-crypto-checkout
- Requires auth + NOWPAYMENTS_API_KEY env var
- Returns 503 with helpful message if NOWPAYMENTS_API_KEY not set (soft fail)
- Creates NOWPayments invoice via `POST https://api.nowpayments.io/v1/invoice`
- orderId format: `migi-{userId8}-{coins}c-{timestamp}`

## Webhook: POST /api/coins/crypto-webhook
- Called by NOWPayments when payment confirmed (status: "finished" or "confirmed")
- Parses userId from orderId, uses sumupRef field for idempotency
- Idempotent — safe to call multiple times

## Expert answered questions: GET /api/expert/answered
- Returns all enquiries with status="answered" for the edit history section in ExpertDashboardPage
