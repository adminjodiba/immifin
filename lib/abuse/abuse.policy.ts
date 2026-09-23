import type {
  AbuseClass,
  AbuseIdentityKind,
  AbusePolicy,
  AbusePolicyId,
  AbuseRouteGroup,
  AbuseWindowSpec,
} from "./abuse.types";

export const ABUSE_ROUTE_POLICIES: Record<AbuseRouteGroup, AbusePolicyId> = {
  h1b_occ: "class-1",
  h1b_geo: "class-2",
  h1b_wage: "class-2",
  h1b_estimate: "class-3",
};

export const ABUSE_POLICIES: Record<AbusePolicyId, AbusePolicy> = {
  "class-1": {
    policyId: "class-1",
    class: 1,
    failMode: "open",
    windows: [
      { id: "short", windowSeconds: 60, anonymousLimit: 80, signedInLimit: 160 },
      { id: "long", windowSeconds: 3600, anonymousLimit: 600, signedInLimit: 1200 },
    ],
  },
  "class-2": {
    policyId: "class-2",
    class: 2,
    failMode: "open",
    windows: [
      { id: "short", windowSeconds: 60, anonymousLimit: 30, signedInLimit: 60 },
      { id: "long", windowSeconds: 3600, anonymousLimit: 120, signedInLimit: 240 },
    ],
  },
  "class-3": {
    policyId: "class-3",
    class: 3,
    failMode: "open",
    windows: [
      { id: "short", windowSeconds: 60, anonymousLimit: 20, signedInLimit: 40 },
      { id: "long", windowSeconds: 3600, anonymousLimit: 60, signedInLimit: 120 },
    ],
  },
};

export function policyIdForRouteGroup(routeGroup: AbuseRouteGroup): AbusePolicyId {
  return ABUSE_ROUTE_POLICIES[routeGroup];
}

export function getAbusePolicy(policyId: AbusePolicyId): AbusePolicy {
  return ABUSE_POLICIES[policyId];
}

export function classForRouteGroup(routeGroup: AbuseRouteGroup): AbuseClass {
  return getAbusePolicy(policyIdForRouteGroup(routeGroup)).class;
}

export function resolveAbuseWindows(
  policy: AbusePolicy,
  identityKind: AbuseIdentityKind,
): AbuseWindowSpec[] {
  return policy.windows.map((window) => ({
    id: window.id,
    windowSeconds: window.windowSeconds,
    limit: identityKind === "user" ? window.signedInLimit : window.anonymousLimit,
  }));
}
