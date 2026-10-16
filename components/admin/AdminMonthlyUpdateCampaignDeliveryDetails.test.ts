import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, it } from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminNotifyUserGroup } from "@/components/admin/AdminNotifyUserGroup";
import type { MonthlyUpdateAudienceSummary } from "@/components/admin/admin-notifications-ui";
import type { NotificationCampaignRecord } from "@/lib/notifications/monthly-update-campaigns";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

const require = createRequire(import.meta.url);
const serverOnlyModulePath = require.resolve("server-only");
require.cache[serverOnlyModulePath] = { exports: {} } as never;
const { selectMonthlyUpdateDeliveryDetailsCampaignId } = require(
  "@/lib/notifications/monthly-update-control-center",
) as typeof import("@/lib/notifications/monthly-update-control-center");

const source = readFileSync("components/admin/AdminMonthlyUpdateCampaignDeliveryDetails.tsx", "utf8");
const modal = readFileSync("components/admin/AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal.tsx", "utf8");
const controlCenter = readFileSync("components/admin/AdminMonthlyUpdateControlCenter.tsx", "utf8");
const notifyUserGroup = readFileSync("components/admin/AdminNotifyUserGroup.tsx", "utf8");
const notificationUi = readFileSync("components/admin/admin-notifications-ui.ts", "utf8");
const controlCenterModel = readFileSync("lib/notifications/monthly-update-control-center.ts", "utf8");

function campaign(
  id: string,
  bulletinMonth: string,
  status: NotificationCampaignRecord["status"] = "completed",
): NotificationCampaignRecord {
  return {
    id,
    campaign_type: "monthly_immigration_update",
    bulletin_month: bulletinMonth,
    status,
    pro_count: 0,
    power_count: 0,
    total_recipients: 0,
    success_count: 0,
    failure_count: 0,
    skipped_count: 0,
    provider: "Resend",
    actor_profile_id: null,
    actor_clerk_user_id: null,
    actor_email: null,
    started_at: null,
    completed_at: "2026-10-16T00:00:00.000Z",
    created_at: "2026-10-16T00:00:00.000Z",
    updated_at: "2026-10-16T00:00:00.000Z",
  };
}

function completedWithFailuresSummary(): MonthlyUpdateAudienceSummary {
  return {
    bulletinMonthKey: "2026-10",
    bulletinMonthLabel: "October 2026",
    bulletinRefreshedAt: "2026-10-01T00:00:00.000Z",
    activeUserCount: 2,
    proCount: 1,
    powerCount: 1,
    totalRecipients: 2,
    skippedCount: 0,
    exclusionBreakdown: {
      freePlan: 0,
      missingImmigrationProfile: 0,
      missingRequiredData: 0,
      notificationOptOut: 0,
      invalidEmail: 0,
      unsupportedProfile: 0,
    },
    lastSentAt: "2026-10-16T00:00:00.000Z",
    lastSentBulletinMonth: "2026-10",
    currentCampaignSentAt: "2026-10-16T00:00:00.000Z",
    previousCampaignBulletinMonth: null,
    previousCampaignSentAt: null,
    campaignId: "a59a7254-b8ce-498e-a4aa-daf321ed7108",
    controlStatus: "Completed with Failures",
    campaignStatus: "completed_with_failures",
    canSend: false,
    sendBlockedReason: "This bulletin month already completed with failures. Duplicate send is blocked.",
    provider: "Resend",
  };
}

describe("Admin Monthly Update campaign delivery and failed-recipient recovery UI", () => {
  it("renders locked tracked and legacy operational states without sensitive delivery data", () => {
    assert.match(source, /Recipient-level delivery tracking was not available for this campaign\./);
    assert.match(source, /details\?\.legacy && !details\.tracked/);
    assert.match(source, /details\?\.tracked/);
    assert.match(source, /Provider Accepted/);
    assert.match(source, /<Metric label="Failed"/);
    assert.match(source, /<Metric label="Skipped"/);
    assert.match(source, /<Metric label="Submission Unknown"/);
    assert.match(source, /Submission status unknown — manual review required\./);
    assert.match(source, /Retryable Failures:/);
    assert.match(source, /failed_before_provider: "Failed Before Provider"/);
    assert.match(source, /failed_provider: "Provider Failed"/);
    assert.match(source, /submission_unknown: "Submission Unknown"/);
    assert.match(source, /No — manual review required/);
    assert.match(source, /function compactProfileId\(profileId: string\)/);
    assert.match(source, /return `Profile …\$\{profileId\.slice\(-4\)\}`/);
    assert.doesNotMatch(source, /title=\{recipient\.profileId\}/);
    assert.doesNotMatch(source, /provider_submission_key|idempotency_key|renderedHtml|renderedText|reason_detail|recipientEmail/);
    assert.doesNotMatch(source, /Delivered/);
    assert.doesNotMatch(source, /October/);
  });

  it("only shows the recovery action from server-backed tracked, non-legacy retryable failure evidence with no active run", () => {
    assert.match(source, /details\.tracked/);
    assert.match(source, /!details\.legacy/);
    assert.match(source, /details\.retryableFailedCount > 0/);
    assert.match(source, /!details\.hasActiveRecoveryRun/);
    assert.match(source, /hasActiveRecoveryRun: boolean/);
    assert.match(source, /latestRecoveryRunStatus: string \| null/);
    assert.match(source, /retryLabel\(details\.retryableFailedCount\)/);
    assert.match(source, /Retry 1 Failed Recipient/);
    assert.match(source, /Retry \$\{retryableFailedCount\} Failed Recipients/);
    assert.doesNotMatch(source, /recipients\.filter\([^\n]*retryable/);
    assert.doesNotMatch(source, /Retry Entire Campaign/);
  });

  it("uses one opaque browser key only at final confirmation and posts no recipient-derived input", () => {
    assert.match(source, /globalThis\.crypto\?\.randomUUID/);
    assert.match(source, /`admin-recovery:\$\{globalThis\.crypto\.randomUUID\(\)\}`/);
    assert.match(source, /body: JSON\.stringify\(\{ confirm: true, idempotencyKey: operationKey \}\)/);
    assert.match(source, /monthly-immigration-updates\/\$\{campaignId\}\/retry-failed/);
    assert.match(source, /method: "POST"/);
    assert.doesNotMatch(source, /JSON\.stringify\([^\n]*(recipient|profile|email|tier|state|count|provider|outcome)/i);
    assert.doesNotMatch(source, /Math\.random/);
    assert.doesNotMatch(source, /console\.(log|warn|error)\([^\n]*operationKey/);
  });

  it("retains the same operation key after ambiguous outcomes, never retries automatically, and refreshes durable details after definitive outcomes", () => {
    assert.match(source, /setRecoveryStatus\("ambiguous"\)/);
    assert.match(source, /The recovery request outcome could not be confirmed\. No new recovery operation will be started automatically\. Check Delivery Details, or retry the same request safely\./);
    assert.match(source, /Retry Same Request/);
    assert.match(source, /recoveryOperationKey && void submitRecovery\(recoveryOperationKey\)/);
    assert.match(source, /await refreshDeliveryDetails\(\)/);
    assert.match(source, /setRecoveryOperationKey\(null\);\s+await refreshDeliveryDetails\(\)/);
    assert.doesNotMatch(source, /setTimeout\([^\n]*submitRecovery|setInterval\([^\n]*submitRecovery/);
  });

  it("uses a dedicated recovery confirmation modal with locked scope and accessibility behavior", () => {
    assert.match(source, /AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal/);
    assert.match(modal, /Retry Failed Recipients\?/);
    assert.match(modal, /1<\/span> recipient with an explicit failure is currently eligible for recovery consideration/);
    assert.match(modal, /retryableFailedCount\}<\/span> recipients with explicit failures are currently eligible for recovery consideration/);
    assert.match(modal, /server determines the actual recipients/);
    assert.match(modal, /Skipped — Ineligible/);
    assert.match(modal, /Submission Unknown and Provider Accepted recipients are excluded/);
    assert.match(modal, /This does not resend the entire campaign/);
    assert.match(modal, /This starts a manual recovery operation for explicit failures only/);
    assert.match(modal, /Starting Recovery…/);
    assert.match(modal, /aria-modal="true"/);
    assert.match(modal, /event\.key === "Escape"/);
    assert.doesNotMatch(modal, /recipient\.map|recipient IDs|@/);
  });

  it("does not retain the removed development visual fixture", () => {
    assert.equal(existsSync("components/admin/AdminMonthlyUpdateFailedRecipientRecoveryPreview.tsx"), false);
    assert.equal(existsSync("app/(my-immifin-workspace)/admin/dev-notification-recovery-preview/page.tsx"), false);
  });

  it("selects the current-month campaign first and otherwise returns October 2026 as the latest completed campaign for Delivery Details", () => {
    const octoberCampaign = campaign(
      "october-2026-legacy-campaign",
      "2026-10",
    );
    const currentCampaign = campaign(
      "november-2026-current-campaign",
      "2026-11",
    );

    assert.equal(
      selectMonthlyUpdateDeliveryDetailsCampaignId({
        currentCampaign: null,
        latestCampaign: octoberCampaign,
      }),
      octoberCampaign.id,
    );
    assert.equal(
      selectMonthlyUpdateDeliveryDetailsCampaignId({
        currentCampaign,
        latestCampaign: octoberCampaign,
      }),
      currentCampaign.id,
    );
    assert.equal(
      selectMonthlyUpdateDeliveryDetailsCampaignId({
        currentCampaign: null,
        latestCampaign: campaign("sending-campaign", "2026-11", "sending"),
      }),
      null,
    );

    assert.match(controlCenterModel, /campaignId: deliveryDetailsCampaignId/);
    assert.match(controlCenter, /sendResult\?\.campaignId \?\? summary\?\.campaignId \?\? null/);
    assert.match(controlCenter, /AdminMonthlyUpdateCampaignDeliveryDetails/);
    assert.match(controlCenter, /monthly-immigration-updates\/send/);
    assert.match(controlCenter, /send-monthly-immigration-update/);
    assert.doesNotMatch(controlCenter, /retry-failed/);
    assert.doesNotMatch(controlCenter, /October 2026/);
  });

  it("renders delivery details in the operational DS2 group workflow for a completed-with-failures campaign without weakening send or legacy safety", () => {
    assert.match(notificationUi, /campaignId: string \| null/);
    assert.match(notifyUserGroup, /AdminMonthlyUpdateCampaignDeliveryDetails/);
    assert.match(notifyUserGroup, /sendResult\?\.campaignId \?\? summary\?\.campaignId \?\? null/);
    assert.match(notifyUserGroup, /deliveryDetailsCampaignId \? \(/);
    assert.match(notifyUserGroup, /campaignId=\{deliveryDetailsCampaignId\}/);
    assert.match(notifyUserGroup, /!summary\.canSend/);
    assert.match(notifyUserGroup, /summary\?\.sendBlockedReason/);
    assert.doesNotMatch(notifyUserGroup, /retry-failed/);
    assert.match(source, /details\?\.legacy && !details\.tracked/);
    assert.match(source, /details\.retryableFailedCount > 0/);
    assert.match(source, /!details\.legacy/);
  });

  it("renders the Delivery Details disclosure for a completed campaign summary even though sending is blocked", () => {
    const html = renderToStaticMarkup(
      createElement(AdminNotifyUserGroup, {
        initialSummary: completedWithFailuresSummary(),
      }),
    );

    assert.match(html, /<h3[^>]*>Delivery Details<\/h3>/);
    assert.match(html, /<button[^>]*aria-expanded="false"[^>]*>Show Delivery Details<\/button>/);
    assert.match(html, /Duplicate send is blocked\./);
    assert.doesNotMatch(html, /<button[^>]*>Generate Update<\/button>/);
  });
});
