import type { AbuseCheckRequest, AbuseCheckResponse } from "../abuse.types";
import {
  assertApprovedAbuseCheckRequestKeys,
  toAbuseCheckRequest,
  type AbuseStore,
} from "./abuseStore";

export const ABUSE_DO_TIMEOUT_MS = 250;
export const ABUSE_DO_TIMEOUT_CODE = "ABUSE_DO_TIMEOUT";

type DurableObjectStub = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

type DurableObjectNamespaceLike = {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
};

export class AbuseDurableObjectTimeoutError extends Error {
  readonly code = ABUSE_DO_TIMEOUT_CODE;

  constructor() {
    super("Abuse Durable Object timed out.");
    this.name = "AbuseDurableObjectTimeoutError";
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new AbuseDurableObjectTimeoutError()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export class DurableObjectAbuseStore implements AbuseStore {
  constructor(
    private readonly namespace: DurableObjectNamespaceLike,
    private readonly timeoutMs: number = ABUSE_DO_TIMEOUT_MS,
  ) {}

  async check(request: AbuseCheckRequest): Promise<AbuseCheckResponse> {
    const payload = toAbuseCheckRequest(request);
    assertApprovedAbuseCheckRequestKeys(payload);

    const stub = this.namespace.get(this.namespace.idFromName(payload.identityKey));
    const response = await withTimeout(
      stub.fetch("https://abuse-gate/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
      this.timeoutMs,
    );

    if (!response.ok) {
      throw new Error("Abuse Durable Object returned a non-OK status.");
    }

    const body = (await response.json()) as AbuseCheckResponse;
    if (body.allowed === true) {
      return { allowed: true };
    }

    if (
      body.allowed === false &&
      (body.exhaustedWindowId === "short" || body.exhaustedWindowId === "long") &&
      Number.isFinite(body.retryAfterSeconds)
    ) {
      return {
        allowed: false,
        retryAfterSeconds: body.retryAfterSeconds,
        exhaustedWindowId: body.exhaustedWindowId,
      };
    }

    throw new Error("Abuse Durable Object returned an invalid decision.");
  }
}
