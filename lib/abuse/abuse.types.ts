export const ABUSE_IDENTITY_KEY_VERSION = 1 as const;

export type AbuseClass = 1 | 2 | 3;
export type AbusePolicyId = "class-1" | "class-2" | "class-3";
export type AbuseWindowId = "short" | "long";
export type AbuseIdentityKind = "anon" | "user";
export type AbuseRouteGroup = "h1b_occ" | "h1b_geo" | "h1b_wage" | "h1b_estimate";
export type AbuseFailMode = "open";
export type AbuseErrorKind =
  | "missing_secret"
  | "missing_binding"
  | "identity_unavailable"
  | "ipv6_parse"
  | "timeout"
  | "rpc"
  | "unexpected";

export type AbuseWindowSpec = {
  id: AbuseWindowId;
  windowSeconds: number;
  limit: number;
};

export type AbuseCheckRequest = {
  identityKey: string;
  policyId: AbusePolicyId;
  windows: AbuseWindowSpec[];
};

export type AbuseCheckResponse =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      exhaustedWindowId: AbuseWindowId;
    };

export type AbuseWindowState = {
  startMs: number;
  count: number;
  expiryMs: number;
};

export type AbusePersistedState = {
  v: 1;
  windows: Record<string, AbuseWindowState>;
};

export type AbuseWindowPolicy = {
  id: AbuseWindowId;
  windowSeconds: number;
  anonymousLimit: number;
  signedInLimit: number;
};

export type AbusePolicy = {
  policyId: AbusePolicyId;
  class: AbuseClass;
  failMode: AbuseFailMode;
  windows: readonly [AbuseWindowPolicy, AbuseWindowPolicy];
};

export const ABUSE_CHECK_REQUEST_KEYS = ["identityKey", "policyId", "windows"] as const;

export const ABUSE_THROTTLED_MESSAGE =
  "Too many requests. Please wait a moment and try again.";
