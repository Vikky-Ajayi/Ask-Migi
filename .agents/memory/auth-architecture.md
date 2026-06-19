---
name: Auth architecture
description: How authentication works in Ask MiGi — token storage, headers, and context.
---

## Rule
Auth uses a simple in-memory token map on the backend (no express-session/JWT library). Token stored in `localStorage` under key `askmigi_token`. Every API request adds `Authorization: Bearer <token>` header via the `getAuthHeaders()` helper in `queryClient.ts`.

## Why
Express-session requires cookie setup and CORS config; JWT requires signing keys. A UUID token map is simpler for a demo/prototype without external deps.

## How to apply
- Backend: `createAuthToken(userId)` → returns UUID; `getUserIdFromToken(token)` → userId. Both in `server/storage.ts`.
- Frontend: `AuthContext` (client/src/context/AuthContext.tsx) manages user state. `useAuth()` hook provides `user`, `isLoggedIn`, `login`, `register`, `logout`, `refreshUser`.
- `DesktopNav` reads from `useAuth()` directly — no props needed for auth state.
- `apiRequest()` in `queryClient.ts` auto-attaches the token header.
- TanStack Query default queryFn also auto-attaches token header.
