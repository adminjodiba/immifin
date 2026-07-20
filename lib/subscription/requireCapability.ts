import "server-only";

import { requireUser } from "@/lib/auth/requireUser";
import { assertCapability } from "@/lib/subscription/assertCapability";
import type { SubscriptionCapability } from "@/lib/subscription/capabilities";
import type { ProfileWithRelations } from "@/lib/supabase/types";

export { assertCapability } from "@/lib/subscription/assertCapability";

/**
 * Requires an authenticated user with the given subscription capability.
 */
export async function requireCapability(
  capability: SubscriptionCapability,
): Promise<ProfileWithRelations> {
  const profileWithRelations = await requireUser();
  assertCapability(profileWithRelations, capability);
  return profileWithRelations;
}
