import "server-only";

export { stripeTimestampToIso } from "@/lib/stripe/timestamps";

/**
 * Extracts a Stripe object ID from expanded or string references.
 */
export function extractStripeId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  return value.id?.trim() || null;
}
