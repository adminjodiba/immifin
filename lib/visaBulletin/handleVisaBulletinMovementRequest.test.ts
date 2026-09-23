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
import { handleVisaBulletinMovementRequest } from "@/lib/visaBulletin/handleVisaBulletinMovementRequest";
import { PREMIUM_VISA_BULLETIN_CACHE_CONTROL } from "@/lib/visaBulletin/premiumBulletinApi";
import type { VisaBulletinMovementRow } from "@/lib/visaBulletinMovement";

const MOVEMENT_ROWS: VisaBulletinMovementRow[] = [
  {
    category: "EB-2",
    country: "INDIA",
    previousDate: "2013-01-01",
    currentDate: "2013-03-01",
    movementType: "forward",
    movementLabel: "Forward 59 days",
    movementLabelStyle: "green",
    movementDays: 59,
    movementMonths: 2,
  },
];

function requireCapabilityForTier(tier: SubscriptionTier) {
  const calls: SubscriptionCapability[] = [];
  return {
    calls,
    requireCapability: async (capability: SubscriptionCapability) => {
      calls.push(capability);
      if (!hasCapability(tier, capability)) {
        throw new AuthError("Movement Tracker requires Pro.", 403);
      }
    },
  };
}

describe("Visa Bulletin Movement API entitlement", () => {
  it("returns 403 with no rows for Free and does not call the Movement loader", async () => {
    const entitlement = requireCapabilityForTier("free");
    let loaderCalls = 0;
    const response = await handleVisaBulletinMovementRequest(
      new Request("http://localhost:3000/api/visa-bulletin-movement?type=final-action"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinMovement: async () => {
          loaderCalls += 1;
          return MOVEMENT_ROWS;
        },
      },
    );

    assert.deepEqual(entitlement.calls, [CAPABILITY.movementTracker]);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Cache-Control"), PREMIUM_VISA_BULLETIN_CACHE_CONTROL);
    assert.deepEqual(await response.json(), { error: "Movement Tracker requires Pro." });
    assert.equal(loaderCalls, 0);
  });

  it("denies a direct Free API call", async () => {
    const entitlement = requireCapabilityForTier("free");
    const response = await handleVisaBulletinMovementRequest(
      new Request("http://localhost:3000/api/visa-bulletin-movement?type=filing"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinMovement: async () => MOVEMENT_ROWS,
      },
    );

    assert.equal(response.status, 403);
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, "Movement Tracker requires Pro.");
    assert.equal(Array.isArray(body), false);
  });

  it("returns 200 with the existing payload for Pro", async () => {
    const entitlement = requireCapabilityForTier("pro");
    let loaderCalls = 0;
    const response = await handleVisaBulletinMovementRequest(
      new Request("http://localhost:3000/api/visa-bulletin-movement?type=final-action"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinMovement: async (type) => {
          loaderCalls += 1;
          assert.equal(type, "final-action");
          return MOVEMENT_ROWS;
        },
      },
    );

    assert.deepEqual(entitlement.calls, [CAPABILITY.movementTracker]);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), PREMIUM_VISA_BULLETIN_CACHE_CONTROL);
    assert.deepEqual(await response.json(), MOVEMENT_ROWS);
    assert.equal(loaderCalls, 1);
  });

  it("returns 200 with the existing payload for Power", async () => {
    const entitlement = requireCapabilityForTier("power");
    const response = await handleVisaBulletinMovementRequest(
      new Request("http://localhost:3000/api/visa-bulletin-movement?type=filing"),
      {
        requireCapability: entitlement.requireCapability,
        getVisaBulletinMovement: async () => MOVEMENT_ROWS,
      },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), MOVEMENT_ROWS);
  });

  it("keeps Movement off PUBLIC_ROUTE_PATTERNS so Clerk middleware still authenticates", () => {
    assert.equal(
      PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.includes("/api/visa-bulletin-movement")),
      false,
    );
  });

  it("production route uses requireCapability and CAPABILITY.movementTracker", () => {
    const route = readFileSync(join(process.cwd(), "app/api/visa-bulletin-movement/route.ts"), "utf8");
    const handler = readFileSync(
      join(process.cwd(), "lib/visaBulletin/handleVisaBulletinMovementRequest.ts"),
      "utf8",
    );
    assert.equal(route.includes("requireCapability"), true);
    assert.equal(route.includes("getVisaBulletinMovement"), true);
    assert.equal(handler.includes("CAPABILITY.movementTracker"), true);
    assert.equal(handler.includes("requireCapability"), true);
    assert.equal(handler.includes("getVisaBulletinMovement"), true);
  });
});
