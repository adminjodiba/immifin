import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coarsenRetryAfterSeconds, createAbuseThrottledResponse } from "@/lib/abuse/abuse.http";
import { ABUSE_THROTTLED_MESSAGE } from "@/lib/abuse/abuse.types";

describe("abuse HTTP 429", () => {
  it("returns the exact public 429 contract", async () => {
    const response = createAbuseThrottledResponse(7);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("Retry-After"), "30");
    const body = (await response.json()) as Record<string, unknown>;
    assert.deepEqual(body, { error: ABUSE_THROTTLED_MESSAGE });
    assert.equal("limit" in body, false);
    assert.equal("remaining" in body, false);
    assert.equal("class" in body, false);
    assert.equal("policy" in body, false);
    assert.equal("exhaustedWindowId" in body, false);
    assert.equal("risk" in body, false);
  });

  it("coarsens Retry-After into 30 / 60 / 120 and caps at 120", () => {
    assert.equal(coarsenRetryAfterSeconds(1), 30);
    assert.equal(coarsenRetryAfterSeconds(30), 30);
    assert.equal(coarsenRetryAfterSeconds(31), 60);
    assert.equal(coarsenRetryAfterSeconds(60), 60);
    assert.equal(coarsenRetryAfterSeconds(61), 120);
    assert.equal(coarsenRetryAfterSeconds(3600), 120);
  });
});
