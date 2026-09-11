import { IntelligenceBetaUnavailableState } from "@/components/intelligence/IntelligenceBetaUnavailableState";
import { IntelligenceLockedState } from "@/components/intelligence/IntelligenceLockedState";
import { IntelligenceWorkspace } from "@/components/intelligence/IntelligenceWorkspace";
import { requireUser } from "@/lib/auth/requireUser";
import { resolveIntelligenceBetaEligibility } from "@/lib/intelligence/beta";
import { canAccessAI } from "@/lib/subscription/capabilities";
import { resolveSubscriptionEntitlement } from "@/lib/subscription/resolveSubscriptionEntitlement";

/**
 * Server-side Intelligence gate after client Power UX gate (S8-IIP-011).
 * Enforces controlled-beta eligibility using Clerk user id + server allowlist.
 * Authoritative API enforcement remains in POST /api/intelligence/ask.
 */
export async function IntelligenceBetaServerGate() {
  const profileWithRelations = await requireUser();
  const { tier } = resolveSubscriptionEntitlement({
    profile: profileWithRelations.profile,
    subscription: profileWithRelations.subscription,
    clerkUserId: profileWithRelations.profile.clerk_user_id,
  });

  // Defense in depth if this server gate is ever rendered without the client Power gate.
  if (!canAccessAI(tier)) {
    return <IntelligenceLockedState embedded />;
  }

  const eligibility = resolveIntelligenceBetaEligibility(
    profileWithRelations.profile.clerk_user_id,
  );

  if (!eligibility.eligible) {
    return <IntelligenceBetaUnavailableState embedded />;
  }

  return <IntelligenceWorkspace />;
}
