/**
 * IMMIFIN Beta pricing display catalog.
 *
 * Safe for client imports. Contains approved display amounts only —
 * no Stripe Price IDs, secrets, or server-only modules.
 *
 * Source of truth for Beta amounts:
 * docs/BUSINESS_MODEL.md · docs/STRIPE_SUBSCRIPTION_PLATFORM_DESIGN.md
 * docs/COMMERCIAL_PLATFORM_VISION.md · docs/ROADMAP_v2.md
 *
 * Future: Commercial Management Platform may replace this catalog source.
 * UI helpers should remain reusable.
 */

import type { SubscriptionTier } from "@/lib/subscription/tiers";
import type { SubscriptionBillingInterval } from "@/lib/supabase/types";

export type PricingDisplayCurrency = "USD";

export type PricingDisplayInterval = SubscriptionBillingInterval | null;

export type PricingDisplayEntry = {
  tier: SubscriptionTier;
  interval: PricingDisplayInterval;
  currency: PricingDisplayCurrency;
  amountMinor: number;
  label: string;
};

export type AnnualSavings = {
  annualizedMonthlyMinor: number;
  annualAmountMinor: number;
  annualSavingsMinor: number;
  annualSavingsPercent: number;
  effectiveMonthlyMinor: number;
};

const USD: PricingDisplayCurrency = "USD";

/**
 * Approved Beta display amounts in USD minor units (cents).
 * Pro/Power annuals are $99.99 / $199.99 (aligned with Stripe Sandbox).
 * Do not invent values — keep aligned with BUSINESS_MODEL / Stripe design docs.
 */
const BETA_PRICING_DISPLAY_CATALOG = {
  free: {
    tier: "free",
    interval: null,
    currency: USD,
    amountMinor: 0,
    label: "Free",
  },
  pro_month: {
    tier: "pro",
    interval: "month",
    currency: USD,
    amountMinor: 999,
    label: "Pro Monthly",
  },
  pro_year: {
    tier: "pro",
    interval: "year",
    currency: USD,
    amountMinor: 9999,
    label: "Pro Annual",
  },
  power_month: {
    tier: "power",
    interval: "month",
    currency: USD,
    amountMinor: 1999,
    label: "Power Monthly",
  },
  power_year: {
    tier: "power",
    interval: "year",
    currency: USD,
    amountMinor: 19999,
    label: "Power Annual",
  },
} as const satisfies Record<string, PricingDisplayEntry>;

export type PricingDisplayCatalogKey = keyof typeof BETA_PRICING_DISPLAY_CATALOG;

function toCheckoutOrBillingInterval(
  interval: "month" | "year" | "monthly" | "annual" | null | undefined,
): PricingDisplayInterval {
  if (interval === "month" || interval === "monthly") {
    return "month";
  }

  if (interval === "year" || interval === "annual") {
    return "year";
  }

  return null;
}

/**
 * Formats an amount stored in minor units (cents) for USD en-US display.
 */
export function formatPriceAmount(
  amountMinor: number,
  currency: PricingDisplayCurrency = "USD",
): string {
  const normalized = Number.isFinite(amountMinor) ? Math.trunc(amountMinor) : 0;

  const isWholeDollar = normalized % 100 === 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isWholeDollar ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(normalized / 100);
}

export function getPricingDisplayEntry(
  tier: SubscriptionTier,
  interval: "month" | "year" | "monthly" | "annual" | null | undefined = null,
): PricingDisplayEntry {
  if (tier === "free") {
    return BETA_PRICING_DISPLAY_CATALOG.free;
  }

  const normalizedInterval = toCheckoutOrBillingInterval(interval);

  if (tier === "pro") {
    return normalizedInterval === "year"
      ? BETA_PRICING_DISPLAY_CATALOG.pro_year
      : BETA_PRICING_DISPLAY_CATALOG.pro_month;
  }

  if (tier === "power") {
    return normalizedInterval === "year"
      ? BETA_PRICING_DISPLAY_CATALOG.power_year
      : BETA_PRICING_DISPLAY_CATALOG.power_month;
  }

  return BETA_PRICING_DISPLAY_CATALOG.free;
}

export function getEffectiveMonthlyAmountForAnnual(tier: "pro" | "power"): number {
  const annual = getPricingDisplayEntry(tier, "year").amountMinor;
  return Math.round(annual / 12);
}

export function getAnnualSavings(tier: "pro" | "power"): AnnualSavings {
  const monthlyAmountMinor = getPricingDisplayEntry(tier, "month").amountMinor;
  const annualAmountMinor = getPricingDisplayEntry(tier, "year").amountMinor;
  const annualizedMonthlyMinor = monthlyAmountMinor * 12;
  const annualSavingsMinor = annualizedMonthlyMinor - annualAmountMinor;
  const annualSavingsPercent =
    annualizedMonthlyMinor > 0
      ? Math.round((annualSavingsMinor * 10000) / annualizedMonthlyMinor) / 100
      : 0;

  return {
    annualizedMonthlyMinor,
    annualAmountMinor,
    annualSavingsMinor,
    annualSavingsPercent,
    effectiveMonthlyMinor: getEffectiveMonthlyAmountForAnnual(tier),
  };
}

export function formatPeriodSuffix(interval: PricingDisplayInterval): string {
  if (interval === "month") {
    return "month";
  }

  if (interval === "year") {
    return "year";
  }

  return "";
}

export function formatPricePerPeriod(
  tier: SubscriptionTier,
  interval: "month" | "year" | "monthly" | "annual" | null | undefined,
): string {
  const entry = getPricingDisplayEntry(tier, interval);
  const amount = formatPriceAmount(entry.amountMinor, entry.currency);

  if (entry.tier === "free" || entry.interval === null) {
    return amount;
  }

  return `${amount}/${formatPeriodSuffix(entry.interval)}`;
}

export function formatCurrentSubscriptionPriceLine(
  tier: SubscriptionTier,
  billingInterval: SubscriptionBillingInterval | null,
): string {
  if (tier === "free" || !billingInterval) {
    return formatPriceAmount(0);
  }

  return formatPricePerPeriod(tier, billingInterval);
}

export function getPaidPlanPricePresentation(
  tier: "pro" | "power",
  displayedInterval: "monthly" | "annual",
): {
  amountLabel: string;
  periodLabel: string;
  billingLabel: string;
  equivalentMonthlyLabel: string | null;
  savingsLabel: string | null;
} {
  if (displayedInterval === "monthly") {
    const entry = getPricingDisplayEntry(tier, "month");
    return {
      amountLabel: formatPriceAmount(entry.amountMinor),
      periodLabel: "per month",
      billingLabel: "Billed monthly",
      equivalentMonthlyLabel: null,
      savingsLabel: null,
    };
  }

  const entry = getPricingDisplayEntry(tier, "year");
  const savings = getAnnualSavings(tier);
  const savingsLabel =
    savings.annualSavingsMinor > 0
      ? `Save ${formatPriceAmount(savings.annualSavingsMinor)} per year (${savings.annualSavingsPercent}%)`
      : null;

  return {
    amountLabel: formatPriceAmount(entry.amountMinor),
    periodLabel: "per year",
    billingLabel: "Billed annually",
    equivalentMonthlyLabel: `Equivalent to ${formatPriceAmount(savings.effectiveMonthlyMinor)}/month`,
    savingsLabel,
  };
}

export function getDestinationListPriceLabel(
  tier: SubscriptionTier,
  interval: "monthly" | "annual" | null,
): string | null {
  if (tier === "free" || interval === null) {
    return formatPriceAmount(0);
  }

  return formatPricePerPeriod(tier, interval);
}

/** Approved Beta amounts for verification against Stripe Sandbox unit_amount. */
export const APPROVED_BETA_AMOUNT_MINORS = {
  pro_month: 999,
  pro_year: 9999,
  power_month: 1999,
  power_year: 19999,
} as const;
