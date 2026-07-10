/**
 * Minimal persistence for Monthly Immigration Update campaigns (duplicate-send protection).
 */

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE =
  "monthly_immigration_update" as const;

export type NotificationCampaignStatus =
  | "ready_to_send"
  | "sending"
  | "completed"
  | "completed_with_failures"
  | "already_sent"
  | "not_ready";

export type NotificationCampaignRecord = {
  id: string;
  campaign_type: string;
  bulletin_month: string;
  status: NotificationCampaignStatus;
  pro_count: number;
  power_count: number;
  total_recipients: number;
  success_count: number;
  failure_count: number;
  skipped_count: number;
  provider: string | null;
  actor_profile_id: string | null;
  actor_clerk_user_id: string | null;
  actor_email: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSendingCampaignInput = {
  bulletinMonth: string;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
  skippedCount: number;
  actorProfileId: string;
  actorClerkUserId: string;
  actorEmail: string;
  provider: string;
};

function mapCampaign(row: Record<string, unknown>): NotificationCampaignRecord {
  return row as unknown as NotificationCampaignRecord;
}

export async function getCompletedMonthlyUpdateCampaign(
  bulletinMonth: string
): Promise<NotificationCampaignRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("campaign_type", MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE)
    .eq("bulletin_month", bulletinMonth)
    .in("status", ["completed", "completed_with_failures"])
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load completed campaign: ${error.message}`);
  }

  return data ? mapCampaign(data) : null;
}

export async function getSendingMonthlyUpdateCampaign(
  bulletinMonth: string
): Promise<NotificationCampaignRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("campaign_type", MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE)
    .eq("bulletin_month", bulletinMonth)
    .eq("status", "sending")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load in-progress campaign: ${error.message}`);
  }

  return data ? mapCampaign(data) : null;
}

export async function getLatestMonthlyUpdateCampaign(): Promise<NotificationCampaignRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_campaigns")
    .select("*")
    .eq("campaign_type", MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE)
    .in("status", ["completed", "completed_with_failures", "sending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load latest campaign: ${error.message}`);
  }

  return data ? mapCampaign(data) : null;
}

export async function createSendingMonthlyUpdateCampaign(
  input: CreateSendingCampaignInput
): Promise<NotificationCampaignRecord> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("notification_campaigns")
    .insert({
      campaign_type: MONTHLY_IMMIGRATION_UPDATE_CAMPAIGN_TYPE,
      bulletin_month: input.bulletinMonth,
      status: "sending",
      pro_count: input.proCount,
      power_count: input.powerCount,
      total_recipients: input.totalRecipients,
      success_count: 0,
      failure_count: 0,
      skipped_count: input.skippedCount,
      provider: input.provider,
      actor_profile_id: input.actorProfileId,
      actor_clerk_user_id: input.actorClerkUserId,
      actor_email: input.actorEmail,
      started_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create sending campaign: ${error.message}`);
  }

  return mapCampaign(data);
}

export async function completeMonthlyUpdateCampaign(input: {
  campaignId: string;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
}): Promise<NotificationCampaignRecord> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const status =
    input.failureCount > 0 ? "completed_with_failures" : "completed";

  const { data, error } = await supabase
    .from("notification_campaigns")
    .update({
      status,
      success_count: input.successCount,
      failure_count: input.failureCount,
      skipped_count: input.skippedCount,
      pro_count: input.proCount,
      power_count: input.powerCount,
      total_recipients: input.totalRecipients,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.campaignId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to complete campaign: ${error.message}`);
  }

  return mapCampaign(data);
}

export async function markMonthlyUpdateCampaignFailed(input: {
  campaignId: string;
  successCount: number;
  failureCount: number;
  skippedCount: number;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  await supabase
    .from("notification_campaigns")
    .update({
      status: "completed_with_failures",
      success_count: input.successCount,
      failure_count: input.failureCount,
      skipped_count: input.skippedCount,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", input.campaignId);
}
