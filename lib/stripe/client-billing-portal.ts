/**
 * Client helper for Stripe-hosted payment method management (S7-BILLING-UX-005).
 */

export type PaymentMethodPortalSessionResponse = {
  url: string;
};

export async function requestPaymentMethodPortalSession(): Promise<PaymentMethodPortalSessionResponse> {
  const response = await fetch("/api/stripe/billing-portal/payment-method", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const payload = (await response.json()) as PaymentMethodPortalSessionResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Unable to open payment method settings.");
  }

  if (!payload.url || typeof payload.url !== "string") {
    throw new Error("Payment method settings URL is unavailable.");
  }

  return { url: payload.url };
}
