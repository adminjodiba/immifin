import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { AuthError } from "@/lib/auth/errors";
import { PUBLIC_ROUTE_PATTERNS } from "@/lib/auth/publicRoutes";
import {
  CAPABILITY,
  hasCapability,
  type SubscriptionCapability,
} from "@/lib/subscription/capabilities";
import type { SubscriptionTier } from "@/lib/subscription/tiers";
import { handleVisaBulletinHistoryRequest } from "@/lib/visaBulletin/handleVisaBulletinHistoryRequest";
import { PREMIUM_VISA_BULLETIN_CACHE_CONTROL } from "@/lib/visaBulletin/premiumBulletinApi";
import type { VisaBulletinHistoryRecord } from "@/lib/visaBulletinHistory";

const HISTORY_RECORDS: VisaBulletinHistoryRecord[] = [
  {
    month: "2026-07",
    category: "EB-2",
    country: "INDIA",
    type: "FinalAction",
    cutoffDate: "2013-01-01",
  },
];

function requireCapabilityForTier(tier: SubscriptionTier) {
  const calls: SubscriptionCapability[] = [];
  return {
    calls,
    requireCapability: async (capability: SubscriptionCapability) => {
      calls.push(capability);
      if (!hasCapability(tier, capability)) {
        throw new AuthError("Visa Bulletin History requires Pro.", 403);
      }
    },
  };
}

describe("Visa Bulletin History API entitlement", () => {
  it("returns 403 with no records for Free and does not call the History loader", async () => {
    const entitlement = requireCapabilityForTier("free");
    let loaderCalls = 0;
    const response = await handleVisaBulletinHistoryRequest(
      new Request("http://localhost:3000/api/visa-bulletin-history?type=FinalAction"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinHistory: async () => {
          loaderCalls += 1;
          return HISTORY_RECORDS;
        },
      },
    );

    assert.deepEqual(entitlement.calls, [CAPABILITY.visaHistory]);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Cache-Control"), PREMIUM_VISA_BULLETIN_CACHE_CONTROL);
    assert.deepEqual(await response.json(), { error: "Visa Bulletin History requires Pro." });
    assert.equal(loaderCalls, 0);
  });

  it("denies a direct Free API call", async () => {
    const entitlement = requireCapabilityForTier("free");
    const response = await handleVisaBulletinHistoryRequest(
      new Request(
        "http://localhost:3000/api/visa-bulletin-history?type=Filing&category=EB-2&country=INDIA",
      ),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinHistory: async () => HISTORY_RECORDS,
      },
    );

    assert.equal(response.status, 403);
    const body = (await response.json()) as { error?: string; length?: number };
    assert.equal(body.error, "Visa Bulletin History requires Pro.");
    assert.equal(Array.isArray(body), false);
  });

  it("returns 200 with the existing payload for Pro", async () => {
    const entitlement = requireCapabilityForTier("pro");
    let loaderCalls = 0;
    const response = await handleVisaBulletinHistoryRequest(
      new Request("http://localhost:3000/api/visa-bulletin-history?type=FinalAction"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinHistory: async () => {
          loaderCalls += 1;
          return HISTORY_RECORDS;
        },
      },
    );

    assert.deepEqual(entitlement.calls, [CAPABILITY.visaHistory]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), PREMIUM_VISA_BULLETIN_CACHE_CONTROL);
    assert.deepEqual(await response.json(), HISTORY_RECORDS);
    assert.equal(loaderCalls, 1);
  });

  it("returns 200 with the existing payload for Power", async () => {
    const entitlement = requireCapabilityForTier("power");
    const response = await handleVisaBulletinHistoryRequest(
      new Request("http://localhost:3000/api/visa-bulletin-history?type=FinalAction"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinHistory: async () => HISTORY_RECORDS,
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), HISTORY_RECORDS);
  });

  it("keeps History off PUBLIC_ROUTE_PATTERNS so Clerk middleware still authenticates", () => {
    assert.equal(
      PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.includes("/api/visa-bulletin-history")),
      false,
    );
  });

  it("production route uses requireCapability and CAPABILITY.visaHistory", () => {
    const route = readFileSync(join(process.cwd(), "app/api/visa-bulletin-history/route.ts"), "utf8");
    const handler = readFileSync(
      join(process.cwd(), "lib/visaBulletin/handleVisaBulletinHistoryRequest.ts"),
      "utf8",
    );
    assert.equal(route.includes("requireCapability"), true);
    assert.equal(route.includes("getVisaBulletinHistory"), true);
    assert.equal(handler.includes("CAPABILITY.visaHistory"), true);
    assert.equal(handler.includes("requireCapability"), true);
    assert.equal(handler.includes("getVisaBulletinHistory"), true);
  });
});
