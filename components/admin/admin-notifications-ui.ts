export type MonthlyUpdateExclusionBreakdown = {
  freePlan: number;
  missingImmigrationProfile: number;
  missingRequiredData: number;
  notificationOptOut: number;
  invalidEmail: number;
  unsupportedProfile: number;
};

export type MonthlyUpdateAudienceSummary = {
  bulletinMonthKey: string | null;
  bulletinMonthLabel: string | null;
  bulletinRefreshedAt: string | null;
  activeUserCount: number;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
  skippedCount: number;
  exclusionBreakdown: MonthlyUpdateExclusionBreakdown;
  lastSentAt: string | null;
  lastSentBulletinMonth: string | null;
  currentCampaignSentAt: string | null;
  previousCampaignBulletinMonth: string | null;
  previousCampaignSentAt: string | null;
  controlStatus: string;
  campaignStatus: string | null;
  canSend: boolean;
  sendBlockedReason: string | null;
  provider: string;
};

export type MonthlyUpdateBulkSendResult = {
  controlStatus: string;
  bulletinMonthKey: string;
  bulletinMonthLabel: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  proCount: number;
  powerCount: number;
  completedAt: string | null;
  provider: string;
  campaignId: string;
};

export type MonthlyUpdatePreviewSummary = {
  recipientEmail: string;
  firstName: string;
  journeyType: "employment_gc_waiting" | "green_card_holder";
  updateMonth: string;
  subject: string;
  immigrationCategory: string | null;
  chargeabilityCountry: string | null;
  priorityDate: string | null;
  finalActionStatus: string | null;
  dateForFilingStatus: string | null;
  finalActionMovement?: string | null;
  dateForFilingMovement?: string | null;
  greenCardIssueDate: string | null;
  earliestFilingDate: string | null;
  daysRemaining: number | null;
  progressPercent?: number | null;
  journeyStatus: string | null;
};

export function formatAdminNotifyTimestamp(value: string | null): string {
  if (!value) {
    return "No campaign yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  })} (Central)`;
}

export function displayAdminNotifyValue(value: string | number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  if (typeof value === "string" && value.trim() === "") {
    return "Not available";
  }

  return String(value);
}

/** Formats a bulletin month key such as 2026-09 as September 2026. */
export function formatAdminNotifyBulletinMonth(
  value: string | null | undefined,
): string {
  if (!value) {
    return "No campaign yet";
  }

  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return value;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
