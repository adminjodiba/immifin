import {
  applyAbuseCheck,
  createEmptyAbuseState,
  isAbuseStateIdle,
  nextCleanupAtMs,
  toAbuseCheckRequest,
} from "../lib/abuse/stores/abuseStore";
import type {
  AbuseCheckRequest,
  AbuseCheckResponse,
  AbusePersistedState,
} from "../lib/abuse/abuse.types";

type DurableObjectStorage = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
  setAlarm?(scheduledTime: number | Date): Promise<void>;
  deleteAlarm?(): Promise<void>;
};

type DurableObjectState = {
  storage: DurableObjectStorage;
};

const STATE_KEY = "state";

/**
 * Dedicated abuse-limiter Durable Object.
 * Receives only identityKey, policyId, and windows. Never calculator payloads.
 */
export class AbuseGate {
  constructor(private readonly ctx: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/check") {
      return new Response("Not found", { status: 404 });
    }

    const body = (await request.json()) as AbuseCheckRequest;
    const result = await this.check(body);
    return Response.json(result);
  }

  async check(input: AbuseCheckRequest): Promise<AbuseCheckResponse> {
    const request = toAbuseCheckRequest(input);
    const nowMs = Date.now();
    const current = (await this.ctx.storage.get<AbusePersistedState>(STATE_KEY)) ?? createEmptyAbuseState();
    const { nextState, response } = applyAbuseCheck(current, request, nowMs);
    await this.ctx.storage.put(STATE_KEY, nextState);

    if (this.ctx.storage.setAlarm) {
      await this.ctx.storage.setAlarm(nextCleanupAtMs(request, nowMs));
    }

    return response;
  }

  async alarm(): Promise<void> {
    const nowMs = Date.now();
    const state = await this.ctx.storage.get<AbusePersistedState>(STATE_KEY);
    if (isAbuseStateIdle(state, nowMs)) {
      await this.ctx.storage.deleteAll();
      return;
    }

    const nextExpiry = Object.values(state?.windows ?? {}).reduce(
      (min, slot) => Math.min(min, slot.expiryMs),
      Number.POSITIVE_INFINITY,
    );
    if (Number.isFinite(nextExpiry) && this.ctx.storage.setAlarm) {
      await this.ctx.storage.setAlarm(nextExpiry + 120_000);
    }
  }
}
