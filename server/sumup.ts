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
  returnUrl: string;      // where SumUp redirects after payment
}

export interface CheckoutResult {
  checkoutId: string;
  payUrl: string;         // https://pay.sumup.com/b2c/{checkoutId}
}

export async function createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
  const merchantCode = await getMerchantCode();

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
      return_url: params.returnUrl,
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
