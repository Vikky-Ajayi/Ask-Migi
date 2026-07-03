---
name: SumUp coin purchase reliability
description: Why coin crediting after SumUp checkout must not depend solely on the browser redirect back to the app.
---

**Critical SumUp API gotcha:** SumUp's Hosted Checkout has two distinct, easily-confused URL fields in `POST /v0.1/checkouts`:
- `redirect_url` — controls a "return to site" **button** on SumUp's success page. Hosted Checkout does **not auto-redirect the browser**; the buyer must click this button. (For APM/3DS flows only, `redirect_url` triggers an automatic redirect — but not for the plain hosted card-checkout flow.)
- `return_url` — a **server-to-server webhook callback** SumUp POSTs checkout status updates to. It is NOT a browser redirect target at all.

Passing your app's return URL as `return_url` (an easy mistake, since the name sounds like "redirect back to me") means: no button appears on SumUp's success page, no webhook fires, and the buyer is stuck on SumUp's page with nothing crediting their purchase — with no errors anywhere, since nothing ever calls back to the app.

**Why:** Even beyond that field mix-up, redirect-button-based payment confirmation is inherently unreliable — buyers may not click the button, browser/network issues can break navigation, and there's no visibility into failures since nothing calls the app's server in that case.

**How to apply:** For SumUp Hosted Checkout specifically: send the app's return page URL as `redirect_url` (button) AND send a webhook endpoint URL as `return_url` (real-time server callback) — implement both. Additionally, any hosted-checkout payment integration should persist a `pending` purchase row with the provider's checkout ID at checkout-creation time, then run a server-side background poller that periodically checks pending checkouts' status directly with the provider and credits/marks them independent of whether the browser ever returns or the webhook ever fires. Treat the client-side verify call and the webhook as fast-paths, not the only path — the poller is the ultimate safety net. Also prefer an explicit, validated production URL env var (e.g. `SITE_URL`) over inferring the host from platform-provided vars like `REPLIT_DOMAINS`, which point at dev/preview domains — and remember that env vars set in one hosting platform (e.g. Replit) do NOT carry over to a separate production host (e.g. Railway); they must be set independently in each place the app actually runs.
