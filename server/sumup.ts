const SUMUP_API = "https://api.sumup.com";

function getApiKey(): string {
  const key = process.env.SUMUP_API_KEY;
  if (!key) throw new Error("SUMUP_API_KEY is not configured.");
  return key;
}

// ── Fetch the merchant code tied to the API key ───────────────────────────────
let cachedMerchantCode: string | null = null;

export async function getMerchantCode(): Promise<string> {
  if (cachedMerchantCode) return cachedMerchantCode;

  const res = await fetch(`${SUMUP_API}/v0.1/me`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SumUp /v1/me failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const code: string | undefined = data?.merchant_profile?.merchant_code;
  if (!code) throw new Error("SumUp: merchant_code missing from /v1/me response.");
  cachedMerchantCode = code;
  return code;
}

// ── Create a hosted checkout ──────────────────────────────────────────────────
export interface CreateCheckoutParams {
  reference: string;      // unique per transaction
  amount: number;         // in major currency units (e.g. 9.99)
  currency: string;       // e.g. "GBP"
  description: string;    // shown to payer
  redirectUrl: string;    // shown as a "return to site" button on SumUp's hosted success page
  webhookUrl?: string;    // optional server-to-server callback SumUp POSTs status updates to
}

export interface CheckoutResult {
  checkoutId: string;
  payUrl: string;         // https://pay.sumup.com/b2c/{checkoutId}
}

export async function createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const merchantCode = await getMerchantCode();

  // IMPORTANT: SumUp's Hosted Checkout does NOT auto-redirect the browser after payment.
  // `redirect_url` controls the "return to site" BUTTON shown on SumUp's success page —
  // it is a distinct field from `return_url`, which is a server-to-server webhook callback
  // (not a browser redirect at all). Confusing these two was the original bug: sending our
  // URL as `return_url` meant SumUp never showed a button and never notified our backend.
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: params.reference,
      amount: params.amount,
      currency: params.currency,
      merchant_code: merchantCode,
      description: params.description,
      redirect_url: params.redirectUrl,
      ...(params.webhookUrl ? { return_url: params.webhookUrl } : {}),
      hosted_checkout: { enabled: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SumUp createCheckout failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const checkoutId: string = data.id;
  // SumUp returns hosted_checkout_url as a top-level field when hosted_checkout.enabled = true
  const payUrl: string =
    data.hosted_checkout_url ?? `https://checkout.sumup.com/pay/c-${checkoutId}`;
  console.log(`[SUMUP] checkout ${checkoutId} payUrl=${payUrl}`);
  return { checkoutId, payUrl };
}

// ── Retrieve checkout status ──────────────────────────────────────────────────
export type CheckoutStatus = "PENDING" | "FAILED" | "PAID" | "CANCELLED";

export interface CheckoutStatusResult {
  id: string;
  status: CheckoutStatus;
  amount: number;
  currency: string;
  reference: string;
}

export async function getCheckoutStatus(checkoutId: string): Promise<CheckoutStatusResult> {
  const res = await fetch(`${SUMUP_API}/v0.1/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SumUp getCheckoutStatus failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    status: data.status as CheckoutStatus,
    amount: data.amount,
    currency: data.currency,
    reference: data.checkout_reference,
  };
}
