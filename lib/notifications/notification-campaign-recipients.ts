import "server-only";

import type { MonthlyUpdateAudienceResolution } from "@/lib/notifications/monthly-update-audience";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { NotificationCampaignRecipient } from "@/lib/supabase/types";

function mapRecipient(row: Record<string, unknown>): NotificationCampaignRecipient {
  return row as NotificationCampaignRecipient;
}

export type OriginalMonthlyUpdateAudienceRow = {
  campaign_id: string;
  profile_id: string;
  original_tier: "pro" | "power" | null;
  original_eligibility_state: "eligible" | "excluded";
  original_exclusion_reason: string | null;
  latest_delivery_state: "eligible_pending" | "audience_excluded";
};

export function buildOriginalMonthlyUpdateAudienceRows(input: {
  campaignId: string;
  audience: MonthlyUpdateAudienceResolution;
}): OriginalMonthlyUpdateAudienceRow[] {
  return input.audience.evaluated.map(({ profileWithRelations, eligibility }) => ({
    campaign_id: input.campaignId,
    profile_id: profileWithRelations.profile.id,
    original_tier: eligibility.kind === "eligible" ? eligibility.tier : null,
    original_eligibility_state: eligibility.kind === "eligible" ? "eligible" : "excluded",
    original_exclusion_reason: eligibility.kind === "skip" ? eligibility.reason : null,
    latest_delivery_state:
      eligibility.kind === "eligible" ? "eligible_pending" : "audience_excluded",
  }));
}

/**
 * Writes the original active-profile audience decision. Email is deliberately
 * absent: profile_id is the sole durable recipient identity.
 */
export async function persistOriginalMonthlyUpdateAudience(input: {
  campaignId: string;
  audience: MonthlyUpdateAudienceResolution;
}): Promise<NotificationCampaignRecipient[]> {
  const rows = buildOriginalMonthlyUpdateAudienceRows(input);

  if (rows.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_campaign_recipients")
    .upsert(rows, { onConflict: "campaign_id,profile_id" })
    .select("*");

  if (error) {
    throw new Error(`Failed to persist original notification audience: ${error.message}`);
  }

  return (data ?? []).map((row) => mapRecipient(row as Record<string, unknown>));
}