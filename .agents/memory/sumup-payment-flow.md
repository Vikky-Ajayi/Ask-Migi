---
name: SumUp coin purchase reliability
description: Why coin crediting after SumUp checkout must not depend solely on the browser redirect back to the app.
---

The SumUp hosted-checkout flow redirects the buyer's browser to a `return_url` after payment, and the client calls `/api/coins/verify-payment` upon landing back on the app. This redirect can silently fail (e.g. a misconfigured `SITE_URL`/host env var producing an invalid or unreachable return URL), leaving the buyer stuck on SumUp's page with no coins credited and no error surfaced anywhere.

**Why:** Redirect-based payment confirmation is inherently unreliable — browser/network issues, ad blockers, or bad env config can all break it, and there's no visibility into failures since nothing calls the app's server in that case.

**How to apply:** Any hosted-checkout payment integration (SumUp, similar providers) should persist a `pending` purchase row with the provider's checkout ID at checkout-creation time, then run a server-side background poller that periodically checks pending checkouts' status directly with the provider and credits/marks them independent of whether the browser ever returns. Treat the client-side verify call as a fast-path, not the only path. Also prefer an explicit, validated production URL env var (e.g. `SITE_URL`) over inferring the host from platform-provided vars like `REPLIT_DOMAINS`, which point at dev/preview domains.
