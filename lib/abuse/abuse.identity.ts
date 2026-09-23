import { createHmac } from "node:crypto";
import { ABUSE_IDENTITY_KEY_VERSION, type AbuseIdentityKind } from "./abuse.types";

export const ABUSE_IDENTITY_SECRET_ENV = "ABUSE_IDENTITY_SECRET";
export const TRUSTED_CLIENT_IP_HEADER = "cf-connecting-ip";
export const LOOPBACK_SENTINEL = "loopback";

export type NormalizedClientIp =
  | { ok: true; material: string }
  | { ok: false; reason: "unavailable" | "ipv6_parse" };

export function getAbuseIdentitySecret(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const value = env[ABUSE_IDENTITY_SECRET_ENV]?.trim();
  return value ? value : null;
}

export function readTrustedClientIp(request: Request): string | null {
  const value = request.headers.get(TRUSTED_CLIENT_IP_HEADER)?.trim();
  return value ? value : null;
}

function parseIPv4(raw: string): string | null {
  const parts = raw.split(".");
  if (parts.length !== 4) {
    return null;
  }

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return null;
    }
    const value = Number(part);
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      return null;
    }
    octets.push(value);
  }

  return octets.join(".");
}

function isIPv4Loopback(canonical: string): boolean {
  return canonical.startsWith("127.");
}

function expandIPv6(raw: string): number[] | null {
  const lowered = raw.toLowerCase();
  if (lowered.includes("%")) {
    return null;
  }

  if (lowered.split("::").length > 2) {
    return null;
  }

  const [head, tail] = lowered.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];

  if (headParts.some((part) => part === "") || tailParts.some((part) => part === "")) {
    return null;
  }

  const missing = 8 - headParts.length - tailParts.length;
  if (lowered.includes("::")) {
    if (missing < 0) {
      return null;
    }
  } else if (headParts.length !== 8) {
    return null;
  }

  const parts = lowered.includes("::")
    ? [...headParts, ...Array.from({ length: missing }, () => "0"), ...tailParts]
    : headParts;

  if (parts.length !== 8) {
    return null;
  }

  const hextets: number[] = [];
  for (const part of parts) {
    if (!/^[0-9a-f]{1,4}$/.test(part)) {
      return null;
    }
    hextets.push(Number.parseInt(part, 16));
  }

  return hextets;
}

function formatHextets(hextets: number[]): string {
  return hextets.map((value) => value.toString(16).padStart(4, "0")).join(":");
}

function parseIPv4MappedIPv6(raw: string): string | null {
  const lowered = raw.toLowerCase();
  const dotted = lowered.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (dotted) {
    return parseIPv4(dotted[1] ?? "");
  }

  const hextets = expandIPv6(lowered);
  if (!hextets) {
    return null;
  }

  const isMapped =
    hextets[0] === 0 &&
    hextets[1] === 0 &&
    hextets[2] === 0 &&
    hextets[3] === 0 &&
    hextets[4] === 0 &&
    hextets[5] === 0xffff;
  if (!isMapped) {
    return null;
  }

  return parseIPv4(`${hextets[6]! >> 8}.${hextets[6]! & 0xff}.${hextets[7]! >> 8}.${hextets[7]! & 0xff}`);
}

function isIPv6Loopback(hextets: number[]): boolean {
  return hextets.slice(0, 7).every((value) => value === 0) && hextets[7] === 1;
}

export function normalizeClientIp(raw: string | null | undefined): NormalizedClientIp {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "unavailable" };
  }

  const trimmed = raw.trim().split("%")[0] ?? "";
  if (!trimmed) {
    return { ok: false, reason: "unavailable" };
  }

  const ipv4 = parseIPv4(trimmed);
  if (ipv4) {
    return { ok: true, material: isIPv4Loopback(ipv4) ? LOOPBACK_SENTINEL : ipv4 };
  }

  const mapped = parseIPv4MappedIPv6(trimmed);
  if (mapped) {
    return { ok: true, material: isIPv4Loopback(mapped) ? LOOPBACK_SENTINEL : mapped };
  }

  if (trimmed.includes(".")) {
    return { ok: false, reason: "unavailable" };
  }

  const hextets = expandIPv6(trimmed);
  if (!hextets) {
    return { ok: false, reason: "ipv6_parse" };
  }

  if (isIPv6Loopback(hextets)) {
    return { ok: true, material: LOOPBACK_SENTINEL };
  }

  return { ok: true, material: formatHextets(hextets.slice(0, 4)) };
}

export function hmacAbuseIdentity(input: {
  kind: AbuseIdentityKind;
  material: string;
  secret: string;
}): string {
  const canonical =
    input.kind === "anon"
      ? `immifin.abuse.anon.v1.${input.material}`
      : `immifin.abuse.user.v1.${input.material}`;
  const digest = createHmac("sha256", input.secret).update(canonical).digest();
  const hex = digest.subarray(0, 16).toString("hex");
  return `v${ABUSE_IDENTITY_KEY_VERSION}:${input.kind}:${hex}`;
}

export function deriveAnonymousIdentityKey(input: {
  clientIp: string | null;
  secret: string;
}): { ok: true; identityKey: string } | { ok: false; reason: "unavailable" | "ipv6_parse" } {
  const normalized = normalizeClientIp(input.clientIp);
  if (!normalized.ok) {
    return normalized;
  }

  return {
    ok: true,
    identityKey: hmacAbuseIdentity({
      kind: "anon",
      material: normalized.material,
      secret: input.secret,
    }),
  };
}

export function deriveUserIdentityKey(input: { userId: string; secret: string }): string {
  return hmacAbuseIdentity({
    kind: "user",
    material: input.userId,
    secret: input.secret,
  });
}
