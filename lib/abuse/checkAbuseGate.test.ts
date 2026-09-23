import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkAbuseGate, isAbuseGateEnabled, resetAbuseObservabilityForTests } from "@/lib/abuse/checkAbuseGate";
import { AbuseDurableObjectTimeoutError } from "@/lib/abuse/stores/durableObjectAbuseStore";
import { MemoryAbuseStore } from "@/lib/abuse/stores/memoryAbuseStore";

const SECRET = "immifin-test-abuse-identity-secret";

function request(ip = "203.0.113.10"): Request {
  return new Request("http://localhost:3000/api/h1b/official-estimate", {
    method: "POST",
    headers: { "cf-connecting-ip": ip },
  });
}

describe("checkAbuseGate fail-open and kill switch", () => {
  it("treats a missing secret as fail-open", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: null,
      store: {
        async check() {
          throw new Error("store should not run");
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("treats a missing binding/store as fail-open in production-like injection", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      userId: null,
      clientIp: "203.0.113.10",
      resolveStore: async () => null,
    });
    assert.equal(decision.allowed, true);
    if (decision.allowed) {
      assert.equal(decision.skipped, "fail_open");
    }
  });

  it("fail-opens when the Durable Object throws", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      userId: null,
      clientIp: "203.0.113.10",
      store: {
        async check() {
          throw new Error("DO RPC failed");
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("fail-opens when the Durable Object times out", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      userId: null,
      clientIp: "203.0.113.10",
      store: {
        async check() {
          throw new AbuseDurableObjectTimeoutError();
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("fail-opens when anonymous identity is unavailable", async () => {
    const decision = await checkAbuseGate({
      request: new Request("http://localhost:3000/api/h1b/official-estimate"),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      userId: null,
      clientIp: null,
      store: {
        async check() {
          throw new Error("store should not run");
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("fail-opens when IPv6 cannot be parsed", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      userId: null,
      clientIp: "gggg::zzzz",
      store: {
        async check() {
          throw new Error("store should not run");
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("skips the limiter when the kill switch is disabled", async () => {
    resetAbuseObservabilityForTests();
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      enabled: false,
      store: {
        async check() {
          throw new Error("store should not run");
        },
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "disabled" });
  });

  it("reads the kill switch from IMMIFIN_ABUSE_GATE_ENABLED", () => {
    const previous = process.env.IMMIFIN_ABUSE_GATE_ENABLED;
    try {
      delete process.env.IMMIFIN_ABUSE_GATE_ENABLED;
      assert.equal(isAbuseGateEnabled(), true);
      process.env.IMMIFIN_ABUSE_GATE_ENABLED = "true";
      assert.equal(isAbuseGateEnabled(), true);
      process.env.IMMIFIN_ABUSE_GATE_ENABLED = "1";
      assert.equal(isAbuseGateEnabled(), true);
      process.env.IMMIFIN_ABUSE_GATE_ENABLED = "false";
      assert.equal(isAbuseGateEnabled(), false);
      process.env.IMMIFIN_ABUSE_GATE_ENABLED = "0";
      assert.equal(isAbuseGateEnabled(), false);
    } finally {
      if (previous === undefined) {
        delete process.env.IMMIFIN_ABUSE_GATE_ENABLED;
      } else {
        process.env.IMMIFIN_ABUSE_GATE_ENABLED = previous;
      }
    }
  });

  it("fail-opens on an unexpected limiter exception", async () => {
    const decision = await checkAbuseGate({
      request: request(),
      routeGroup: "h1b_estimate",
      secret: SECRET,
      fetchUserId: async () => {
        throw new Error("unexpected clerk failure");
      },
    });
    assert.deepEqual(decision, { allowed: true, skipped: "fail_open" });
  });

  it("shares one CLASS 2 budget across geography and official-wage", async () => {
    const store = new MemoryAbuseStore(() => 1_000);
    const shared = {
      secret: SECRET,
      userId: null as string | null,
      clientIp: "203.0.113.77",
      store,
    };
    for (let index = 0; index < 15; index += 1) {
      assert.equal(
        (await checkAbuseGate({ request: request(), routeGroup: "h1b_geo", ...shared })).allowed,
        true,
      );
    }
    for (let index = 0; index < 15; index += 1) {
      assert.equal(
        (await checkAbuseGate({ request: request(), routeGroup: "h1b_wage", ...shared })).allowed,
        true,
      );
    }
    const denied = await checkAbuseGate({ request: request(), routeGroup: "h1b_wage", ...shared });
    assert.equal(denied.allowed, false);
  });

  it("throttles through the gate using a memory store", async () => {
    const store = new MemoryAbuseStore(() => 1_000);
    const runtime = {
      request: request(),
      routeGroup: "h1b_estimate" as const,
      secret: SECRET,
      userId: null,
      clientIp: "203.0.113.88",
      store,
    };
    for (let index = 0; index < 20; index += 1) {
      const allowed = await checkAbuseGate(runtime);
      assert.equal(allowed.allowed, true);
    }
    const denied = await checkAbuseGate(runtime);
    assert.equal(denied.allowed, false);
    if (!denied.allowed) {
      assert.equal(denied.exhaustedWindowId, "short");
    }
  });
});
