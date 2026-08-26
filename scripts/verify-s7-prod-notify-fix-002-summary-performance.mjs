/**
 * S7-PROD-NOTIFY-FIX-002 — Fast Monthly Update audience summary.
 * Run: npx tsx scripts/verify-s7-prod-notify-fix-002-summary-performance.mjs
 *
 * Pure/source + local eligibility checks — no Resend, no campaign mutation, no Sheets refresh.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateMonthlyUpdateSummaryEligibility } from "../lib/notifications/monthly-update-audience.ts";
import {
  campaignUpdateMonthLabelFromKey,
  MONTHLY_UPDATE_ASSEMBLY_ERROR,
  MonthlyUpdateAssemblyError,
} from "../lib/notifications/build-monthly-immigration-report-dashboard-source.ts";
import { formatVisaBulletinMonthLong } from "../lib/visaBulletinHistory.ts";
import { NOTIFICATION_PREFERENCES_KEY } from "../lib/account/notificationPreferences.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

const audienceSrc = readSource("lib/notifications/monthly-update-audience.ts");
const controlSrc = readSource("lib/notifications/monthly-update-control-center.ts");
const summaryRouteSrc = readSource(
  "app/api/admin/notifications/monthly-immigration-updates/summary/route.ts"
);
const sendRouteSrc = readSource(
  "app/api/admin/notifications/monthly-immigration-updates/send/route.ts"
);
const previewRouteSrc = readSource(
  "app/api/admin/notifications/send-monthly-immigration-update/route.ts"
);

assert(
  "summary audience module does not call prepareMonthlyImmigrationUpdateForUser",
  !audienceSrc.includes("prepareMonthlyImmigrationUpdateForUser")
);
assert(
  "summary audience module does not call getVisaBulletinMovement",
  !audienceSrc.includes("getVisaBulletinMovement")
);
assert(
  "summary audience module does not call buildEmploymentJourneyData",
  !audienceSrc.includes("buildEmploymentJourneyData")
);
assert(
  "summary audience uses evaluateMonthlyUpdateSummaryEligibility",
  audienceSrc.includes("evaluateMonthlyUpdateSummaryEligibility") &&
    /export async function resolveMonthlyUpdateAudience[\s\S]*evaluateMonthlyUpdateSummaryEligibility/.test(
      audienceSrc
    )
);
assert(
  "summary GET uses buildMonthlyUpdateAudienceSummary",
  summaryRouteSrc.includes("buildMonthlyUpdateAudienceSummary") &&
    !summaryRouteSrc.includes("prepareMonthlyImmigrationUpdateForUser")
);
const summaryFnSrc = controlSrc.slice(
  controlSrc.indexOf("export async function buildMonthlyUpdateAudienceSummary"),
  controlSrc.indexOf("export async function sendMonthlyImmigrationUpdatesBulk")
);
assert(
  "control-center summary does not call prepareMonthlyImmigrationUpdateForUser",
  summaryFnSrc.includes("resolveMonthlyUpdateAudience") &&
    !summaryFnSrc.includes("prepareMonthlyImmigrationUpdateForUser")
);
assert(
  "bulk send still uses authoritative prepareMonthlyImmigrationUpdateForUser",
  /export async function sendMonthlyImmigrationUpdatesBulk[\s\S]*prepareMonthlyImmigrationUpdateForUser/.test(
    controlSrc
  )
);
assert(
  "bulk send API still delegates to sendMonthlyImmigrationUpdatesBulk",
  sendRouteSrc.includes("sendMonthlyImmigrationUpdatesBulk")
);
assert(
  "preview/send-one-user still uses prepareMonthlyImmigrationUpdateForUser",
  previewRouteSrc.includes("prepareMonthlyImmigrationUpdateForUser")
);
assert(
  "campaign month still uses latest Visa Bulletin month, not calendar new Date()",
  controlSrc.includes("getLatestVisaBulletinMonth") &&
    !controlSrc.includes("resolveCalendarUpdateMonthLabel") &&
    campaignUpdateMonthLabelFromKey("2026-09") === "September 2026" &&
    formatVisaBulletinMonthLong("2026-09") === "September 2026"
);

const nowIso = "2026-08-26T12:00:00.000Z";

function baseProfile(overrides = {}) {
  return {
    id: "profile-1",
    clerk_user_id: "user_1",
    email: "pro@example.com",
    role: "user",
    plan: "pro",
    display_name: "Test",
    avatar_url: null,
    phone_number: null,
    status: "active",
    role_updated_at: null,
    role_updated_by_clerk_user_id: null,
    last_seen_at: null,
    last_login_at: null,
    clerk_synced_at: null,
    created_at: nowIso,
    updated_at: nowIso,
    ...overrides,
  };
}

function employmentImmigration(overrides = {}) {
  return {
    id: "imm-1",
    profile_id: "profile-1",
    default_category: "EB2",
    default_country: "India",
    default_bulletin_type: "final-action",
    priority_date: "2012-05-01",
    green_card_issue_date: null,
    married_to_us_citizen: false,
    preferences: {},
    created_at: nowIso,
    updated_at: nowIso,
    ...overrides,
  };
}

function wrap(profile, immigrationProfile) {
  return {
    profile,
    subscription: null,
    immigrationProfile,
  };
}

const proEmployment = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile(), employmentImmigration())
);
assert(
  "Pro/Power valid employment candidate remains eligible",
  proEmployment.kind === "eligible" && proEmployment.tier === "pro"
);

const powerEmployment = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ plan: "power", email: "power@example.com" }), employmentImmigration())
);
assert(
  "Power valid employment candidate remains eligible",
  powerEmployment.kind === "eligible" && powerEmployment.tier === "power"
);

const gcEligible = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ email: "gc@example.com" }), employmentImmigration({
    green_card_issue_date: "2022-08-02",
    default_category: null,
    default_country: null,
    priority_date: null,
  }))
);
assert(
  "Pro Green Card holder with issue date remains eligible",
  gcEligible.kind === "eligible"
);

const freeUser = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ plan: "free", email: "free@example.com" }), employmentImmigration())
);
assert(
  "Free users remain excluded",
  freeUser.kind === "skip" && freeUser.reason === "free_plan"
);

const optOutEmail = evaluateMonthlyUpdateSummaryEligibility(
  wrap(
    baseProfile({ email: "optout@example.com" }),
    employmentImmigration({
      preferences: {
        [NOTIFICATION_PREFERENCES_KEY]: {
          emailAlerts: false,
          visaBulletinUpdates: true,
        },
      },
    })
  )
);
assert(
  "notification email opt-out remains excluded",
  optOutEmail.kind === "skip" && optOutEmail.reason === "email_alerts_disabled"
);

const optOutBulletin = evaluateMonthlyUpdateSummaryEligibility(
  wrap(
    baseProfile({ email: "vb-off@example.com" }),
    employmentImmigration({
      preferences: {
        [NOTIFICATION_PREFERENCES_KEY]: {
          emailAlerts: true,
          visaBulletinUpdates: false,
        },
      },
    })
  )
);
assert(
  "visa bulletin opt-out remains excluded",
  optOutBulletin.kind === "skip" &&
    optOutBulletin.reason === "visa_bulletin_updates_disabled"
);

const invalidEmail = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ email: "not-an-email" }), employmentImmigration())
);
assert(
  "invalid email remains excluded",
  invalidEmail.kind === "skip" && invalidEmail.reason === "missing_email"
);

const missingProfile = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ email: "noprof@example.com" }), null)
);
assert(
  "missing immigration profile remains excluded",
  missingProfile.kind === "skip" &&
    missingProfile.reason === "missing_immigration_profile"
);

const missingData = evaluateMonthlyUpdateSummaryEligibility(
  wrap(
    baseProfile({ email: "incomplete@example.com" }),
    employmentImmigration({
      default_category: "EB2",
      default_country: "India",
      priority_date: null,
    })
  )
);
assert(
  "missing required employment data remains classified",
  missingData.kind === "skip" && missingData.reason === "missing_required_data"
);

const inactive = evaluateMonthlyUpdateSummaryEligibility(
  wrap(baseProfile({ status: "suspended", email: "inactive@example.com" }), employmentImmigration())
);
assert(
  "unsupported/inactive profile remains classified",
  inactive.kind === "skip" && inactive.reason === "unsupported_profile"
);

let threw = false;
try {
  campaignUpdateMonthLabelFromKey(null);
} catch (error) {
  threw =
    error instanceof MonthlyUpdateAssemblyError &&
    error.code === MONTHLY_UPDATE_ASSEMBLY_ERROR.BULLETIN_MONTH_UNAVAILABLE;
}
assert("missing bulletin month still fails closed (FIX-001)", threw);

console.log("S7-PROD-NOTIFY-FIX-002 verifier PASS");
