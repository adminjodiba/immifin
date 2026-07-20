export type ContactStatusCacheValue = "ok" | "needs_phone";

let cachedUserId: string | null = null;
let cachedStatus: ContactStatusCacheValue | null = null;

/** In-memory session cache: contact onboarding is checked once per signed-in user. */
export function getContactStatusCache(userId: string): ContactStatusCacheValue | null {
  if (cachedUserId !== userId) {
    return null;
  }

  return cachedStatus;
}

export function setContactStatusCache(userId: string, status: ContactStatusCacheValue) {
  cachedUserId = userId;
  cachedStatus = status;
}

export function markContactStatusOk(userId: string) {
  setContactStatusCache(userId, "ok");
}

export function clearContactStatusCache() {
  cachedUserId = null;
  cachedStatus = null;
}
