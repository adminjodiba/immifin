/**
 * S7-PROD-NOTIFY-FIX-001 — Monthly Update campaign month alignment.
 * Run: npx tsx scripts/verify-s7-prod-notify-fix-001-month-alignment.mjs
 *
 * Pure/source checks only — no Resend, no campaign mutation, no Sheets refresh.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildMonthlyImmigrationReportSubject } from "../emails/templates/monthly-immigration-report-email.tsx";
import { formatVisaBulletinMonthLong } from "../lib/visaBulletinHistory.ts";
import {
  campaignUpdateMonthLabelFromKey,
  MONTHLY_UPDATE_ASSEMBLY_ERROR,
  MonthlyUpdateAssemblyError,
} from "../lib/notifications/build-monthly-immigration-report-dashboard-source.ts";
import { mapMonthlyImmigrationReportEmailProps } from "../lib/notifications/mappers/map-monthly-immigration-report-email.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

const assemblerSrc = readSource(
  "lib/notifications/build-monthly-immigration-report-dashboard-source.ts"
);
const mapperSrc = readSource(
  "lib/notifications/mappers/map-monthly-immigration-report-email.ts"
);
const bulkSrc = readSource("lib/notifications/monthly-update-control-center.ts");
const previewRouteSrc = readSource(
  "app/api/admin/notifications/send-monthly-immigration-update/route.ts"
);

assert(
  "calendar helper resolveCalendarUpdateMonthLabel is gone",
  !assemblerSrc.includes("resolveCalendarUpdateMonthLabel")
);
assert(
  "assembler does not format campaign month from new Date()",
  !assemblerSrc.includes("Intl.DateTimeFormat")
);
assert(
  "campaign month resolver uses getLatestVisaBulletinMonth",
  assemblerSrc.includes("getLatestVisaBulletinMonth()") &&
    assemblerSrc.includes("campaignUpdateMonthLabelFromKey")
);
assert(
  "Green Card holder assemble uses resolveCampaignUpdateMonth",
  /async function assembleGreenCardSource[\s\S]*resolveCampaignUpdateMonth\(\)/.test(
    assemblerSrc
  )
);
assert(
  "Employment assemble uses resolveCampaignUpdateMonth",
  /async function assembleEmploymentSource[\s\S]*resolveCampaignUpdateMonth\(\)/.test(
    assemblerSrc
  )
);
assert(
  "Preview API uses prepareMonthlyImmigrationUpdateForUser",
  previewRouteSrc.includes("prepareMonthlyImmigrationUpdateForUser")
);
assert(
  "Bulk send uses prepareMonthlyImmigrationUpdateForUser",
  bulkSrc.includes("prepareMonthlyImmigrationUpdateForUser") &&
    bulkSrc.includes("sendMonthlyImmigrationUpdatesBulk")
);
assert(
  "employment mapper uses source.updateMonthLabel not journey.bulletinMonthLabel",
  mapperSrc.includes("updateMonthLabel: source.updateMonthLabel") &&
    !mapperSrc.includes("updateMonthLabel: journey.bulletinMonthLabel")
);

const RealDate = Date;
const frozenNow = new RealDate("2026-08-26T15:13:00.000Z");
class FrozenDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(frozenNow.getTime());
      return;
    }
    super(...args);
  }
  static now() {
    return frozenNow.getTime();
  }
}
globalThis.Date = FrozenDate;

try {
  const labelFromKey = campaignUpdateMonthLabelFromKey("2026-09");
  assert("latest bulletin key 2026-09 formats as September 2026", labelFromKey === "September 2026");
  assert(
    "formatVisaBulletinMonthLong(2026-09) is September 2026",
    formatVisaBulletinMonthLong("2026-09") === "September 2026"
  );

  const gcSubject = buildMonthlyImmigrationReportSubject(labelFromKey);
  assert(
    "Green Card holder subject uses September 2026",
    gcSubject === "IMMIFIN | Your September 2026 Immigration Update"
  );

  const employmentSubject = buildMonthlyImmigrationReportSubject(
    campaignUpdateMonthLabelFromKey("2026-09")
  );
  assert(
    "Employment journey subject uses September 2026",
    employmentSubject === "IMMIFIN | Your September 2026 Immigration Update"
  );
  assert("Preview and employment subjects are identical", gcSubject === employmentSubject);

  assert(
    "calendar 2026-08-26 does not force August campaign month",
    labelFromKey !== "August 2026" &&
      new Date().toISOString().startsWith("2026-08-26")
  );

  const gcMapped = mapMonthlyImmigrationReportEmailProps({
    journeyType: "green_card_holder",
    firstName: "Test",
    dashboardUrl: "https://immifin.com/dashboard",
    updateMonthLabel: campaignUpdateMonthLabelFromKey("2026-09"),
    journey: {
      greenCardIssueDate: "2022-08-02",
      greenCardIssueDateFormatted: "August 2, 2022",
      todayFormatted: "August 26, 2026",
      earliestFilingDateFormatted: "May 4, 2027",
      eligibilityDateFormatted: "August 2, 2027",
      yearsAsPermanentResident: "4 years",
      daysUntilEligible: 251,
      eligibilityStatus: "not_eligible_yet",
      eligibilityStatusLabel: "Not eligible yet",
      progress: { fillPercent: 50, todayPercent: 50, todayMarkerPercent: 50 },
      summary: {
        daysCompleted: 1400,
        daysCompletedDuration: "3 years",
        totalRequiredDays: 1826,
        daysRemaining: 251,
        progressPercent: 76,
      },
      waitingPeriodYears: 5,
      waitingPeriodDescription: "5-year path",
      citizenshipResult: {},
    },
  });
  assert(
    "GC issue date August 2, 2022 does not affect campaign month",
    gcMapped.updateMonthLabel === "September 2026" &&
      gcMapped.greenCardIssueDateDisplay === "August 2, 2022"
  );

  let threw = false;
  try {
    campaignUpdateMonthLabelFromKey(null);
  } catch (error) {
    threw = error instanceof MonthlyUpdateAssemblyError;
    assert(
      "missing bulletin month fails closed",
      threw &&
        error.code === MONTHLY_UPDATE_ASSEMBLY_ERROR.BULLETIN_MONTH_UNAVAILABLE
    );
  }
  assert("null bulletin key throws", threw);
} finally {
  globalThis.Date = RealDate;
}

console.log("S7-PROD-NOTIFY-FIX-001 verifier PASS");
