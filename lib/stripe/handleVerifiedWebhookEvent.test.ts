import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type Stripe from "stripe";
import { WRITE_FREEZE_ENV, WRITE_FREEZE_MESSAGE } from "@/lib/platform/writeFreeze";
import { handleVerifiedStripeWebhookEvent } from "./handleVerifiedWebhookEvent";

const originalFlag = process.env[WRITE_FREEZE_ENV];

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env[WRITE_FREEZE_ENV];
  } else {
    process.env[WRITE_FREEZE_ENV] = originalFlag;
  }
});

function fakeEvent(): Stripe.Event {
  return {
    id: "evt_freeze_fixture",
    type: "customer.subscription.updated",
  } as Stripe.Event;
}

describe("handleVerifiedStripeWebhookEvent", () => {
  it("returns 503 and does not claim the event when freeze is on", async () => {
    process.env[WRITE_FREEZE_ENV] = "1";
    const claim = mock.fn(async () => {
      throw new Error("claim RPC must not run while frozen");
    });

    const response = await handleVerifiedStripeWebhookEvent(fakeEvent(), {
      claimStripeWebhookEvent: claim,
      completeStripeWebhookEvent: mock.fn(async () => {
        throw new Error("complete must not run while frozen");
      }),
      failStripeWebhookEvent: mock.fn(async () => {
        throw new Error("fail must not run while frozen");
      }),
      dispatchStripeWebhookEvent: mock.fn(async () => {
        throw new Error("dispatch must not run while frozen");
      }),
      sanitizeStripeWebhookErrorMessage: (message) => message ?? null,
    });

    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Retry-After"), "120");
    const body = (await response.json()) as { error?: string };
    assert.equal(body.error, WRITE_FREEZE_MESSAGE);
    assert.equal(claim.mock.callCount(), 0);
  });

  it("keeps existing unfrozen duplicate-delivery behavior", async () => {
    delete process.env[WRITE_FREEZE_ENV];
    const claim = mock.fn(async () => ({
      outcome: "already_completed" as const,
      event: {} as never,
    }));

    const response = await handleVerifiedStripeWebhookEvent(fakeEvent(), {
      claimStripeWebhookEvent: claim,
      completeStripeWebhookEvent: mock.fn(async () => {
        throw new Error("complete must not run for duplicates");
      }),
      failStripeWebhookEvent: mock.fn(async () => {
        throw new Error("fail must not run for duplicates");
      }),
      dispatchStripeWebhookEvent: mock.fn(async () => {
        throw new Error("dispatch must not run for duplicates");
      }),
      sanitizeStripeWebhookErrorMessage: (message) => message ?? null,
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as { received?: boolean; duplicate?: boolean };
    assert.equal(body.received, true);
    assert.equal(body.duplicate, true);
    assert.equal(claim.mock.callCount(), 1);
  });
});
