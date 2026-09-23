import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AbuseCheckRequest } from "@/lib/abuse/abuse.types";
import {
  applyAbuseCheck,
  assertApprovedAbuseCheckRequestKeys,
  createEmptyAbuseState,
  isAbuseStateIdle,
  toAbuseCheckRequest,
} from "@/lib/abuse/stores/abuseStore";
import { MemoryAbuseStore } from "@/lib/abuse/stores/memoryAbuseStore";

function request(overrides: Partial<AbuseCheckRequest> = {}): AbuseCheckRequest {
  return toAbuseCheckRequest({
    identityKey: "v1:anon:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    policyId: "class-3",
    windows: [
      { id: "short", windowSeconds: 60, limit: 2 },
      { id: "long", windowSeconds: 3600, limit: 3 },
    ],
    ...overrides,
  });
}

describe("abuse store counters", () => {
  it("allows requests below both window limits", async () => {
    const store = new MemoryAbuseStore(() => 1_000);
    assert.deepEqual(await store.check(request()), { allowed: true });
    assert.deepEqual(await store.check(request()), { allowed: true });
  });

  it("throttles the short window", async () => {
    const store = new MemoryAbuseStore(() => 1_000);
    await store.check(request());
    await store.check(request());
    const denied = await store.check(request());
    assert.equal(denied.allowed, false);
    if (!denied.allowed) {
      assert.equal(denied.exhaustedWindowId, "short");
      assert.equal(denied.retryAfterSeconds, 60);
    }
  });

  it("throttles the long window after the short window resets", async () => {
    let now = 1_000;
    const store = new MemoryAbuseStore(() => now);
    await store.check(request());
    await store.check(request());
    now = 1_000 + 60_000;
    assert.deepEqual(await store.check(request()), { allowed: true });
    const denied = await store.check(request());
    assert.equal(denied.allowed, false);
    if (!denied.allowed) {
      assert.equal(denied.exhaustedWindowId, "long");
    }
  });

  it("resets a window after it expires", async () => {
    let now = 1_000;
    const store = new MemoryAbuseStore(() => now);
    await store.check(request({ windows: [{ id: "short", windowSeconds: 60, limit: 1 }] }));
    const denied = await store.check(request({ windows: [{ id: "short", windowSeconds: 60, limit: 1 }] }));
    assert.equal(denied.allowed, false);
    now = 1_000 + 60_000;
    assert.deepEqual(
      await store.check(request({ windows: [{ id: "short", windowSeconds: 60, limit: 1 }] })),
      { allowed: true },
    );
  });

  it("persists versioned per-identity window state", async () => {
    const store = new MemoryAbuseStore(() => 5_000);
    await store.check(request());
    const state = store.inspect("v1:anon:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    assert.equal(state?.v, 1);
    assert.equal(state?.windows["class-3:short"]?.count, 1);
    assert.equal(state?.windows["class-3:long"]?.count, 1);
  });

  it("treats expired persisted state as idle", () => {
    const now = 10_000;
    const idle = applyAbuseCheck(createEmptyAbuseState(), request(), now).nextState;
    idle.windows["class-3:short"] = { startMs: 0, count: 4, expiryMs: 1_000 };
    idle.windows["class-3:long"] = { startMs: 0, count: 4, expiryMs: 1_000 };
    assert.equal(isAbuseStateIdle(idle, now), true);
  });

  it("keeps only approved keys on the Durable Object request", () => {
    const payload = toAbuseCheckRequest(request());
    assert.deepEqual(Object.keys(payload).sort(), ["identityKey", "policyId", "windows"]);
    assertApprovedAbuseCheckRequestKeys(payload);
    assert.throws(() => assertApprovedAbuseCheckRequestKeys({ ...payload, zip: "77433" }));
    assert.equal("zip" in payload, false);
    assert.equal("soc" in payload, false);
    assert.equal("salary" in payload, false);
    assert.equal("clientIp" in payload, false);
    assert.equal("userId" in payload, false);
  });
});
