import type { NextResponse } from "next/server";
import { createAbuseThrottledResponse } from "./abuse.http";
import {
  deriveAnonymousIdentityKey,
  deriveUserIdentityKey,
  getAbuseIdentitySecret,
  readTrustedClientIp,
} from "./abuse.identity";
import { classForRouteGroup, getAbusePolicy, policyIdForRouteGroup, resolveAbuseWindows } from "./abuse.policy";
import type {
  AbuseCheckRequest,
  AbuseErrorKind,
  AbuseIdentityKind,
  AbuseRouteGroup,
  AbuseWindowId,
} from "./abuse.types";
import { DurableObjectAbuseStore, AbuseDurableObjectTimeoutError } from "./stores/durableObjectAbuseStore";
import { getDevelopmentMemoryAbuseStore, type MemoryAbuseStore } from "./stores/memoryAbuseStore";
import { toAbuseCheckRequest, type AbuseStore } from "./stores/abuseStore";

export const ABUSE_GATE_ENABLED_ENV = "IMMIFIN_ABUSE_GATE_ENABLED";
export const ABUSE_STORE_ERROR_LOG_WINDOW_MS = 60_000;

export type AbuseGateDecision =
  | { allowed: true; skipped?: "disabled" | "fail_open" }
  | { allowed: false; retryAfterSeconds: number; exhaustedWindowId: AbuseWindowId };

export type CheckAbuseGateInput = {
  request: Request;
  routeGroup: AbuseRouteGroup;
  store?: AbuseStore;
  secret?: string | null;
  userId?: string | null;
  clientIp?: string | null;
  nowMs?: number;
  enabled?: boolean;
  fetchUserId?: () => Promise<string | null>;
  resolveStore?: () => Promise<AbuseStore | null>;
};

const lastStoreErrorLog = new Map<string, number>();

export function isAbuseGateEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[ABUSE_GATE_ENABLED_ENV];
  if (raw === undefined) {
    return true;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0";
}

function recordAllow(): void {
  // Allow events are aggregated only. Do not log every request.
}

function recordThrottle(input: {
  class: number;
  routeGroup: AbuseRouteGroup;
  identityKind: AbuseIdentityKind;
  window: AbuseWindowId;
}): void {
  console.warn("[abuse] throttle", {
    class: input.class,
    route_group: input.routeGroup,
    identity_kind: input.identityKind,
    window: input.window,
  });
}

function recordDisabled(routeGroup: AbuseRouteGroup): void {
  const key = `disabled:${routeGroup}`;
  const now = Date.now();
  if ((lastStoreErrorLog.get(key) ?? 0) + ABUSE_STORE_ERROR_LOG_WINDOW_MS > now) {
    return;
  }
  lastStoreErrorLog.set(key, now);
  console.warn("[abuse] disabled", {
    class: classForRouteGroup(routeGroup),
    route_group: routeGroup,
  });
}

function recordStoreError(input: {
  routeGroup: AbuseRouteGroup;
  errorKind: AbuseErrorKind;
}): void {
  const key = `${input.routeGroup}:${input.errorKind}`;
  const now = Date.now();
  if ((lastStoreErrorLog.get(key) ?? 0) + ABUSE_STORE_ERROR_LOG_WINDOW_MS > now) {
    return;
  }
  lastStoreErrorLog.set(key, now);
  console.warn("[abuse] store_error", {
    class: classForRouteGroup(input.routeGroup),
    route_group: input.routeGroup,
    error_kind: input.errorKind,
  });
}

async function readClerkUserId(): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}

async function resolveProductionStore(): Promise<AbuseStore | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const binding = (env as { ABUSE_GATE?: ConstructorParameters<typeof DurableObjectAbuseStore>[0] }).ABUSE_GATE;
    if (binding) {
      return new DurableObjectAbuseStore(binding);
    }
  } catch {
    // Binding/context unavailable — fall through.
  }

  if (process.env.NODE_ENV !== "production") {
    return getDevelopmentMemoryAbuseStore();
  }

  return null;
}

export async function checkAbuseGate(input: CheckAbuseGateInput): Promise<AbuseGateDecision> {
  const enabled = input.enabled ?? isAbuseGateEnabled();
  if (!enabled) {
    recordDisabled(input.routeGroup);
    return { allowed: true, skipped: "disabled" };
  }

  try {
    const secret = input.secret === undefined ? getAbuseIdentitySecret() : input.secret;
    if (!secret) {
      recordStoreError({ routeGroup: input.routeGroup, errorKind: "missing_secret" });
      return { allowed: true, skipped: "fail_open" };
    }

    const userId =
      input.userId !== undefined ? input.userId : await (input.fetchUserId ?? readClerkUserId)();
    const identityKind: AbuseIdentityKind = userId ? "user" : "anon";

    let identityKey: string;
    if (userId) {
      identityKey = deriveUserIdentityKey({ userId, secret });
    } else {
      const clientIp = input.clientIp !== undefined ? input.clientIp : readTrustedClientIp(input.request);
      const derived = deriveAnonymousIdentityKey({ clientIp, secret });
      if (!derived.ok) {
        recordStoreError({
          routeGroup: input.routeGroup,
          errorKind: derived.reason === "ipv6_parse" ? "ipv6_parse" : "identity_unavailable",
        });
        return { allowed: true, skipped: "fail_open" };
      }
      identityKey = derived.identityKey;
    }

    const policy = getAbusePolicy(policyIdForRouteGroup(input.routeGroup));
    const request: AbuseCheckRequest = toAbuseCheckRequest({
      identityKey,
      policyId: policy.policyId,
      windows: resolveAbuseWindows(policy, identityKind),
    });

    let store: AbuseStore | null | undefined = input.store;
    if (store === undefined) {
      store = input.resolveStore ? await input.resolveStore() : await resolveProductionStore();
    }
    if (!store) {
      recordStoreError({ routeGroup: input.routeGroup, errorKind: "missing_binding" });
      return { allowed: true, skipped: "fail_open" };
    }

    let decision;
    try {
      decision = await store.check(request);
    } catch (error: unknown) {
      const errorKind: AbuseErrorKind =
        error instanceof AbuseDurableObjectTimeoutError ? "timeout" : "rpc";
      recordStoreError({ routeGroup: input.routeGroup, errorKind });
      return { allowed: true, skipped: "fail_open" };
    }

    if (decision.allowed) {
      recordAllow();
      return { allowed: true };
    }

    recordThrottle({
      class: policy.class,
      routeGroup: input.routeGroup,
      identityKind,
      window: decision.exhaustedWindowId,
    });
    return decision;
  } catch {
    recordStoreError({ routeGroup: input.routeGroup, errorKind: "unexpected" });
    return { allowed: true, skipped: "fail_open" };
  }
}

export async function enforceAbuseGate(
  request: Request,
  routeGroup: AbuseRouteGroup,
  runtime?: Omit<CheckAbuseGateInput, "request" | "routeGroup">,
): Promise<NextResponse | null> {
  const decision = await checkAbuseGate({
    request,
    routeGroup,
    ...runtime,
  });

  if (decision.allowed) {
    return null;
  }

  return createAbuseThrottledResponse(decision.retryAfterSeconds);
}

export function resetAbuseObservabilityForTests(): void {
  lastStoreErrorLog.clear();
}

export type { MemoryAbuseStore };
