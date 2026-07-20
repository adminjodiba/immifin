/**
 * Converts Stripe unix timestamps to UTC ISO strings for Supabase.
 * Accepts only finite positive numeric seconds — does not invent dates.
 */
export function stripeTimestampToIso(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return new Date(value * 1000).toISOString();
}
