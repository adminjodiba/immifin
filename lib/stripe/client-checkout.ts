export const CHECKOUT_BILLING_INTERVALS = ["monthly", "annual"] as const;

export type CheckoutBillingInterval = (typeof CHECKOUT_BILLING_INTERVALS)[number];

export type StripeCheckoutTier = "pro" | "power";

export type StartStripeCheckoutInput = {
  tier: StripeCheckoutTier;
  interval: CheckoutBillingInterval;
};

export type StartStripeCheckoutResult = {
  url: string;
};

function isSafeCheckoutRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith("stripe.com");
  } catch {
    return false;
  }
}

function friendlyCheckoutError(status: number, message: string | undefined): string {
  if (status === 401 || status === 403) {
    return "Please sign in to continue to checkout.";
  }

  if (status === 409) {
    return message ?? "Checkout is only available when upgrading from a Free plan.";
  }

  if (status === 503) {
    return "Billing is temporarily unavailable. Please try again shortly.";
  }

  if (status >= 500) {
    return "Unable to start checkout right now. Please try again.";
  }

  return message ?? "Unable to start checkout. Please try again.";
}

/**
 * Starts Stripe Checkout via the authenticated server endpoint.
 * Sends only tier and interval — no Stripe IDs or redirect URLs.
 */
export async function startStripeCheckout(
  input: StartStripeCheckoutInput,
): Promise<StartStripeCheckoutResult> {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tier: input.tier,
      interval: input.interval,
    }),
  });

  let payload: { url?: unknown; error?: string } | null = null;

  try {
    payload = (await response.json()) as { url?: unknown; error?: string };
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(friendlyCheckoutError(response.status, payload?.error));
  }

  if (typeof payload?.url !== "string" || !isSafeCheckoutRedirectUrl(payload.url)) {
    throw new Error("Checkout could not be started. Please try again.");
  }

  return { url: payload.url };
}
