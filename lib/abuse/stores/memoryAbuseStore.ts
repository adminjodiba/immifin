import type { AbuseCheckRequest, AbuseCheckResponse, AbusePersistedState } from "../abuse.types";
import { applyAbuseCheck, type AbuseStore } from "./abuseStore";

/**
 * Process-local store for unit tests and `next dev`.
 * Not distributed. Not Production security.
 */
export class MemoryAbuseStore implements AbuseStore {
  private readonly identities = new Map<string, AbusePersistedState>();

  constructor(private readonly nowMs: () => number = () => Date.now()) {}

  async check(request: AbuseCheckRequest): Promise<AbuseCheckResponse> {
    const current = this.identities.get(request.identityKey);
    const { nextState, response } = applyAbuseCheck(current, request, this.nowMs());
    this.identities.set(request.identityKey, nextState);
    return response;
  }

  inspect(identityKey: string): AbusePersistedState | undefined {
    return this.identities.get(identityKey);
  }

  clear(): void {
    this.identities.clear();
  }
}

let developmentStore: MemoryAbuseStore | null = null;

export function getDevelopmentMemoryAbuseStore(): MemoryAbuseStore {
  if (!developmentStore) {
    developmentStore = new MemoryAbuseStore();
  }
  return developmentStore;
}
