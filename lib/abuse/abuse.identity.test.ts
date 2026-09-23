import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveAnonymousIdentityKey,
  deriveUserIdentityKey,
  hmacAbuseIdentity,
  LOOPBACK_SENTINEL,
  normalizeClientIp,
} from "@/lib/abuse/abuse.identity";

const SECRET = "immifin-test-abuse-identity-secret";

describe("abuse identity", () => {
  it("maps the same IPv4 to the same identity", () => {
    const first = deriveAnonymousIdentityKey({ clientIp: "203.0.113.10", secret: SECRET });
    const second = deriveAnonymousIdentityKey({ clientIp: "203.0.113.10", secret: SECRET });
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.identityKey, second.identityKey);
    }
  });

  it("maps different IPv4 addresses to different identities", () => {
    const first = deriveAnonymousIdentityKey({ clientIp: "203.0.113.10", secret: SECRET });
    const second = deriveAnonymousIdentityKey({ clientIp: "203.0.113.11", secret: SECRET });
    assert.equal(first.ok && second.ok, true);
    if (first.ok && second.ok) {
      assert.notEqual(first.identityKey, second.identityKey);
    }
  });

  it("canonicalizes IPv4 before HMAC", () => {
    const dotted = deriveAnonymousIdentityKey({ clientIp: "203.0.113.10", secret: SECRET });
    const padded = deriveAnonymousIdentityKey({ clientIp: "203.000.113.010", secret: SECRET });
    assert.equal(dotted.ok && padded.ok, true);
    if (dotted.ok && padded.ok) {
      assert.equal(dotted.identityKey, padded.identityKey);
    }
  });

  it("keeps raw IP out of the final identity", () => {
    const derived = deriveAnonymousIdentityKey({ clientIp: "203.0.113.10", secret: SECRET });
    assert.equal(derived.ok, true);
    if (derived.ok) {
      assert.equal(derived.identityKey.includes("203.0.113.10"), false);
      assert.match(derived.identityKey, /^v1:anon:[0-9a-f]{32}$/);
    }
  });

  it("collapses the same IPv6 /64 to one identity", () => {
    const first = deriveAnonymousIdentityKey({
      clientIp: "2001:db8:0:1:aaaa:bbbb:cccc:dddd",
      secret: SECRET,
    });
    const second = deriveAnonymousIdentityKey({
      clientIp: "2001:db8:0:1:1111:2222:3333:4444",
      secret: SECRET,
    });
    assert.equal(first.ok && second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.identityKey, second.identityKey);
    }
  });

  it("maps different IPv6 /64 prefixes to different identities", () => {
    const first = deriveAnonymousIdentityKey({ clientIp: "2001:db8:0:1::1", secret: SECRET });
    const second = deriveAnonymousIdentityKey({ clientIp: "2001:db8:0:2::1", secret: SECRET });
    assert.equal(first.ok && second.ok, true);
    if (first.ok && second.ok) {
      assert.notEqual(first.identityKey, second.identityKey);
    }
  });

  it("treats IPv4-mapped IPv6 as IPv4", () => {
    const ipv4 = deriveAnonymousIdentityKey({ clientIp: "192.0.2.10", secret: SECRET });
    const mapped = deriveAnonymousIdentityKey({ clientIp: "::ffff:192.0.2.10", secret: SECRET });
    assert.equal(ipv4.ok && mapped.ok, true);
    if (ipv4.ok && mapped.ok) {
      assert.equal(ipv4.identityKey, mapped.identityKey);
    }
  });

  it("shares the loopback sentinel for IPv4 and IPv6 localhost", () => {
    assert.deepEqual(normalizeClientIp("127.0.0.1"), { ok: true, material: LOOPBACK_SENTINEL });
    assert.deepEqual(normalizeClientIp("127.1.2.3"), { ok: true, material: LOOPBACK_SENTINEL });
    assert.deepEqual(normalizeClientIp("::1"), { ok: true, material: LOOPBACK_SENTINEL });
    const v4 = deriveAnonymousIdentityKey({ clientIp: "127.0.0.1", secret: SECRET });
    const v6 = deriveAnonymousIdentityKey({ clientIp: "::1", secret: SECRET });
    assert.equal(v4.ok && v6.ok, true);
    if (v4.ok && v6.ok) {
      assert.equal(v4.identityKey, v6.identityKey);
    }
  });

  it("keeps signed-in identity stable and omits the raw Clerk userId", () => {
    const first = deriveUserIdentityKey({ userId: "user_abc123", secret: SECRET });
    const second = deriveUserIdentityKey({ userId: "user_abc123", secret: SECRET });
    assert.equal(first, second);
    assert.equal(first.includes("user_abc123"), false);
    assert.match(first, /^v1:user:[0-9a-f]{32}$/);
  });

  it("uses the approved HMAC namespaces", () => {
    const anon = hmacAbuseIdentity({ kind: "anon", material: "203.0.113.10", secret: SECRET });
    const user = hmacAbuseIdentity({ kind: "user", material: "user_abc123", secret: SECRET });
    assert.match(anon, /^v1:anon:[0-9a-f]{32}$/);
    assert.match(user, /^v1:user:[0-9a-f]{32}$/);
    assert.notEqual(anon, user);
  });
});
