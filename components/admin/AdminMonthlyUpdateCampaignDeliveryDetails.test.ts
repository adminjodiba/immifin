import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const source = readFileSync(
  "components/admin/AdminMonthlyUpdateCampaignDeliveryDetails.tsx",
  "utf8",
);
const controlCenter = readFileSync(
  "components/admin/AdminMonthlyUpdateControlCenter.tsx",
  "utf8",
);
const controlCenterModel = readFileSync(
  "lib/notifications/monthly-update-control-center.ts",
  "utf8",
);

describe("Admin Monthly Update campaign delivery visibility UI", () => {
  it("renders the locked tracked and legacy operational states without sensitive delivery data", () => {
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
    assert.match(source, /<th className=.*Profile/);
    assert.match(source, /function compactProfileId\(profileId: string\)/);
    assert.match(source, /return `Profile …\$\{profileId\.slice\(-4\)\}`/);
    assert.match(source, /title=\{recipient\.profileId\}/);
    assert.match(source, /Recovery History/);
    assert.match(source, /Previous failed-recipient recovery attempts for this campaign\./);
    assert.match(source, /Original Audience/);
    assert.match(source, /\{details\.originalEligibleCount\} eligible · \{details\.originalExcludedCount\} excluded/);
    assert.doesNotMatch(source, /provider_submission_key/);
    assert.doesNotMatch(source, /idempotency_key/);
    assert.doesNotMatch(source, /renderedHtml|renderedText|reason_detail|recipientEmail/);
    assert.doesNotMatch(source, /Delivered/);
  });

  it("uses bounded server pagination and a read-only delivery-details GET without retry controls", () => {
    assert.match(source, /const PAGE_SIZE = 50/);
    assert.match(source, /delivery-details\?page=\$\{requestedPage\}&pageSize=\$\{PAGE_SIZE\}/);
    assert.match(source, /method: "GET"/);
    assert.match(source, /Page \{details\.pagination\.totalPages === 0 \? 0 : details\.pagination\.page\} of \{details\.pagination\.totalPages\}/);
    assert.match(source, /disabled=\{!canGoPrevious\}/);
    assert.match(source, /disabled=\{!canGoNext\}/);
    assert.match(source, /Loading delivery details\.\.\./);
    assert.match(source, /Unable to load delivery details\./);
    assert.match(source, /export function AdminMonthlyUpdateCampaignDeliveryDetails\(\{ campaignId \}: \{ campaignId: string \}\)/);
    assert.doesNotMatch(source, /retry-failed/);
    assert.doesNotMatch(source, /<button[^>]*>\s*Retry/i);
  });

  it("integrates alongside the existing workflow using the current campaign ID only", () => {
    assert.match(controlCenterModel, /campaignId: blockingCampaign\?\.id \?\? null/);
    assert.match(controlCenter, /sendResult\?\.campaignId \?\? summary\?\.campaignId \?\? null/);
    assert.match(controlCenter, /AdminMonthlyUpdateCampaignDeliveryDetails/);
    assert.match(controlCenter, /monthly-immigration-updates\/send/);
    assert.match(controlCenter, /send-monthly-immigration-update/);
    assert.doesNotMatch(controlCenter, /retry-failed/);
    assert.doesNotMatch(controlCenter, /October 2026/);
  });
});