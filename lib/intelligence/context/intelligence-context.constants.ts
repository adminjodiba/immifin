/**
 * IMMIFIN Intelligence Context — version constants.
 * Keep the version string centralized; do not duplicate across files.
 */

/** Intelligence Context contract version (S8-IIP-001). */
export const INTELLIGENCE_CONTEXT_VERSION = "1.0.0";

/** Stable missing-field identifiers used in readiness.missingRequiredFields. */
export const INTELLIGENCE_MISSING_FIELD = {
  COUNTRY_OF_CHARGEABILITY: "immigration.countryOfChargeability",
  EMPLOYMENT_BASED_CATEGORY: "immigration.employmentBasedCategory",
  PRIORITY_DATE: "immigration.priorityDate",
  GREEN_CARD_ISSUE_DATE: "greenCard.issueDate",
} as const;

/** Stable non-blocking warning codes used in readiness.warnings. */
export const INTELLIGENCE_WARNING = {
  CURRENT_IMMIGRATION_STATUS_UNAVAILABLE:
    "immigration.currentImmigrationStatus_unavailable",
  VISA_BULLETIN_MONTH_UNAVAILABLE: "visaBulletin.bulletinMonth_unavailable",
  FINAL_ACTION_DATE_UNAVAILABLE: "visaBulletin.finalActionDate_unavailable",
  DATE_FOR_FILING_UNAVAILABLE: "visaBulletin.dateForFiling_unavailable",
  FIRST_NAME_UNAVAILABLE: "user.firstName_unavailable",
  GREEN_CARD_ISSUE_DATE_ABSENT: "greenCard.issueDate_absent",
} as const;
