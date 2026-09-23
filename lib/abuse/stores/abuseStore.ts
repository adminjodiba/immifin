import type {
  AbuseCheckRequest,
  AbuseCheckResponse,
  AbusePersistedState,
  AbuseWindowState,
} from "../abuse.types";
import { ABUSE_CHECK_REQUEST_KEYS } from "../abuse.types";

export type AbuseStore = {
  check(request: AbuseCheckRequest): Promise<AbuseCheckResponse>;
};

export function windowStorageKey(policyId: AbuseCheckRequest["policyId"], windowId: string): string {
  return `${policyId}:${windowId}`;
}

export function createEmptyAbuseState(): AbusePersistedState {
  return { v: 1, windows: {} };
}

export function toAbuseCheckRequest(input: AbuseCheckRequest): AbuseCheckRequest {
  return {
    identityKey: input.identityKey,
    policyId: input.policyId,
    windows: input.windows.map((window) => ({
      id: window.id,
      windowSeconds: window.windowSeconds,
      limit: window.limit,
    })),
  };
}

export function assertApprovedAbuseCheckRequestKeys(request: object): void {
  const keys = Object.keys(request).sort();
  const approved = [...ABUSE_CHECK_REQUEST_KEYS].sort();
  if (keys.length !== approved.length || keys.some((key, index) => key !== approved[index])) {
    throw new Error("Abuse check request contains unapproved keys.");
  }
}

export function applyAbuseCheck(
  state: AbusePersistedState | undefined,
  request: AbuseCheckRequest,
  nowMs: number,
): { nextState: AbusePersistedState; response: AbuseCheckResponse } {
  const nextState: AbusePersistedState = {
    v: 1,
    windows: { ...(state?.windows ?? {}) },
  };

  for (const window of request.windows) {
    const key = windowStorageKey(request.policyId, window.id);
    const existing = nextState.windows[key];
    const expired = !existing || nowMs >= existing.expiryMs;
    const slot: AbuseWindowState = expired
      ? {
          startMs: nowMs,
          count: 1,
          expiryMs: nowMs + window.windowSeconds * 1000,
        }
      : {
          startMs: existing.startMs,
          count: existing.count + 1,
          expiryMs: existing.expiryMs,
        };
    nextState.windows[key] = slot;
  }

  for (const window of request.windows) {
    const slot = nextState.windows[windowStorageKey(request.policyId, window.id)];
    if (slot && slot.count > window.limit) {
      return {
        nextState,
        response: {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((slot.expiryMs - nowMs) / 1000)),
          exhaustedWindowId: window.id,
        },
      };
    }
  }

  return { nextState, response: { allowed: true } };
}

export function longestWindowSeconds(request: AbuseCheckRequest): number {
  return request.windows.reduce((max, window) => Math.max(max, window.windowSeconds), 0);
}

export function nextCleanupAtMs(request: AbuseCheckRequest, nowMs: number): number {
  return nowMs + (longestWindowSeconds(request) + 120) * 1000;
}

export function isAbuseStateIdle(state: AbusePersistedState | undefined, nowMs: number): boolean {
  if (!state || Object.keys(state.windows).length === 0) {
    return true;
  }

  return Object.values(state.windows).every((slot) => nowMs >= slot.expiryMs);
}
