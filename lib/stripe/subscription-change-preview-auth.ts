import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getStripeSecretKey } from "@/lib/stripe/config";
import { StripeSubscriptionChangeError } from "@/lib/stripe/errors";
import type { BillingInterval } from "@/lib/stripe/types";

/**
 * Short-lived signed preview authorization for immediate upgrades.
 * S7-BILLING-UX-003 — HMAC-SHA256 using existing STRIPE_SECRET_KEY (no new env secret).
 *
 * Token claims are customer-safe (no Stripe customer/subscription/price IDs).
 */
export const SUBSCRIPTION_CHANGE_PREVIEW_AUTH_TTL_SECONDS = 10 * 60;
export const SUBSCRIPTION_CHANGE_PREVIEW_AUTH_VERSION = 1 as const;

export type SubscriptionChangePreviewAuthClaims = {
  v: typeof SUBSCRIPTION_CHANGE_PREVIEW_AUTH_VERSION;
  profileId: string;
  targetTier: "pro" | "power";
  targetInterval: BillingInterval;
  prorationDate: number;
  iat: number;
  exp: number;
};

function base64UrlEncode(value: string | Buffer): string {
  const buf = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecodeToString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64").toString("utf8");
}

function signPayload(payloadB64: string): string {
  const secret = getStripeSecretKey();
  return base64UrlEncode(
    createHmac("sha256", secret).update(`immifin.sub_preview.v1.${payloadB64}`).digest(),
  );
}

function safeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function createSubscriptionChangePreviewAuthorization(input: {
  profileId: string;
  targetTier: "pro" | "power";
  targetInterval: BillingInterval;
  prorationDate: number;
  nowSeconds?: number;
}): string {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const claims: SubscriptionChangePreviewAuthClaims = {
    v: SUBSCRIPTION_CHANGE_PREVIEW_AUTH_VERSION,
    profileId: input.profileId,
    targetTier: input.targetTier,
    targetInterval: input.targetInterval,
    prorationDate: input.prorationDate,
    iat: now,
    exp: now + SUBSCRIPTION_CHANGE_PREVIEW_AUTH_TTL_SECONDS,
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(claims));
  const signature = signPayload(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySubscriptionChangePreviewAuthorization(input: {
  token: string;
  profileId: string;
  targetTier: "pro" | "power";
  targetInterval: BillingInterval;
  nowSeconds?: number;
}): SubscriptionChangePreviewAuthClaims {
  const token = input.token.trim();
  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new StripeSubscriptionChangeError("Invalid preview authorization.", 400);
  }

  const [payloadB64, signature] = parts;
  const expected = signPayload(payloadB64);

  if (!safeEqualStrings(signature, expected)) {
    throw new StripeSubscriptionChangeError("Invalid preview authorization.", 400);
  }

  let claims: SubscriptionChangePreviewAuthClaims;

  try {
    claims = JSON.parse(base64UrlDecodeToString(payloadB64)) as SubscriptionChangePreviewAuthClaims;
  } catch {
    throw new StripeSubscriptionChangeError("Invalid preview authorization.", 400);
  }

  if (claims.v !== SUBSCRIPTION_CHANGE_PREVIEW_AUTH_VERSION) {
    throw new StripeSubscriptionChangeError("Preview authorization version is not supported.", 400);
  }

  if (typeof claims.profileId !== "string" || claims.profileId !== input.profileId) {
    throw new StripeSubscriptionChangeError("Preview authorization does not match this account.", 403);
  }

  if (claims.targetTier !== input.targetTier || claims.targetInterval !== input.targetInterval) {
    throw new StripeSubscriptionChangeError(
      "Preview authorization does not match the requested plan change.",
      400,
    );
  }

  if (
    typeof claims.prorationDate !== "number" ||
    !Number.isFinite(claims.prorationDate) ||
    !Number.isInteger(claims.prorationDate)
  ) {
    throw new StripeSubscriptionChangeError("Invalid preview authorization.", 400);
  }

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (typeof claims.exp !== "number" || claims.exp < now) {
    throw new StripeSubscriptionChangeError(
      "Preview authorization has expired. Please review the upgrade again.",
      400,
    );
  }

  if (typeof claims.iat !== "number" || claims.iat > now + 60) {
    throw new StripeSubscriptionChangeError("Invalid preview authorization.", 400);
  }

  return claims;
}