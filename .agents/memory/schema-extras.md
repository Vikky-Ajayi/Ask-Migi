---
name: Schema extras
description: New columns added to users and enquiries tables, and corresponding AuthUser type updates.
---

## Users table additions
- `unlimitedCoins boolean NOT NULL DEFAULT false` — bypasses coin deduction on enquiry creation
- `profilePic text` — base64 data URL or external URL; shown in expert dashboard and next to answered enquiries

## Enquiries table additions
- `answeredByPic text` — snapshot of expert's profilePic at answer time; rendered in ChatPage/EnquiriesPage instead of "E" letter
- `answerEditedAt timestamp` — updated every time updateEnquiryAnswer is called

## AuthUser interface (client/src/context/AuthContext.tsx)
Must always include `unlimitedCoins: boolean` and `profilePic?: string | null` — without these, ExpertDashboardPage and any component reading user.profilePic will have TS errors that prevent compilation.

**Why:** These fields were added to the DB schema but the client type wasn't updated, causing a build failure that froze the app on the preloader screen.

## Coin deduction bypass
In POST /api/enquiries, the coin check and deduction are both gated on `!user.unlimitedCoins`.
