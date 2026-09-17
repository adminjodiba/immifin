import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderMonthlyImmigrationReportEmail } from "../../emails/templates/monthly-immigration-report-email";
import type { EmploymentJourneyData } from "../dashboard/employmentJourney";
import {
  EMPLOYMENT_WAITING_EMAIL_ADVISOR_SUMMARY,
  formatEmploymentEmailMovementDetail,
  mapGreenCardAdvisorSummary,
  mapMonthlyHighlight,
  mapMonthlyImmigrationReportEmailProps,
  type EmploymentMonthlyImmigrationReportDashboardSource,
} from "./mappers/map-monthly-immigration-report-email";

(globalThis as { React?: typeof React }).React = React;

function waitingCard(
  overrides: Partial<EmploymentJourneyData["finalAction"]> & {
    title: string;
    cutoffMarkerTitle: string;
    cutoffFormatted: string;
  },
): EmploymentJourneyData["finalAction"] {
  return {
    subtitle:
      "This compares your Priority Date, the Visa Bulletin cutoff, and today on a real calendar timeline.",
    timelineStartFormatted: "March 1, 2012",
    priorityDateFormatted: "August 14, 2014",
    todayFormatted: "October 10, 2026",
    daysSincePriorityDate: 4441,
    daysSincePriorityLabel: "4,441 days since priority date",
    status: "waiting",
    statusLabel: "Waiting",
    isPositive: false,
    priorityMarkerPercent: 20,
    cutoffMarkerPercent: 8,
    todayMarkerPercent: 100,
    priorityLabelPercent: 20,
    cutoffLabelPercent: 8,
    fillPercent: 100,
    statusExplanation:
      "Your priority date is after the published cutoff. You are still waiting.",
    meaningMessage: "The Final Action Date has not reached your Priority Date yet.",
    error: null,
    ...overrides,
  };
}

const TEST_JOURNEY: EmploymentJourneyData = {
  priorityDate: "2014-08-14",
  priorityDateFormatted: "August 14, 2014",
  categoryLabel: "EB2",
  countryLabel: "India",
  preferredBulletinTypeLabel: "Final Action Dates",
  bulletinMonthLabel: "October 2026",
  todayFormatted: "October 10, 2026",
  daysSincePriorityDate: 4441,
  daysSincePriorityDuration: "12 years, 1 month, 26 days",
  priorityDateAgoLabel: "12 years, 1 month, 26 days",
  datesForFiling: waitingCard({
    title: "Dates for Filing",
    cutoffMarkerTitle: "Current Filing Date Cutoff",
    cutoffFormatted: "January 15, 2012",
    meaningMessage:
      "The Dates for Filing cutoff has not reached your Priority Date yet.",
  }),
  finalAction: waitingCard({
    title: "Final Action Date",
    cutoffMarkerTitle: "Current Final Action Cutoff",
    cutoffFormatted: "March 1, 2012",
  }),
};

const TEST_SOURCE: EmploymentMonthlyImmigrationReportDashboardSource = {
  journeyType: "employment_gc_waiting",
  firstName: "Test",
  dashboardUrl: "http://localhost:3003/dashboard",
  journey: TEST_JOURNEY,
  updateMonthLabel: "October 2026",
  comparisonMonthLabel: "September 2026",
  finalActionMovement: {
    movementType: "now-available",
    movementDays: null,
    movementLabel: "Now Available",
  },
  datesForFilingMovement: {
    movementType: "retrogression",
    movementDays: -1096,
    movementLabel: "-37 Months",
  },
};

describe("monthly immigration update preview rendering", () => {
  it("highlight uses movement Now Available and member Waiting, not bulletin Unavailable", () => {
    const highlight = mapMonthlyHighlight(
      TEST_JOURNEY,
      TEST_SOURCE.finalActionMovement,
    );
    assert.match(highlight, /Final Action Now Available/i);
    assert.match(highlight, /still waiting/i);
    assert.doesNotMatch(highlight, /still unavailable/i);
  });

  it("renders production template HTML and text without send", async () => {
    const emailProps = mapMonthlyImmigrationReportEmailProps(TEST_SOURCE);
    assert.equal(emailProps.journeyType, "employment_gc_waiting");
    if (emailProps.journeyType !== "employment_gc_waiting") {
      return;
    }
    assert.equal(emailProps.finalActionStatus, "Waiting");
    assert.equal(emailProps.dateForFilingStatus, "Waiting");

    const rendered = await renderMonthlyImmigrationReportEmail(emailProps);

    assert.ok(rendered.html.includes("<"));
    assert.ok(rendered.html.length > 200);
    assert.match(rendered.html, /Now Available/i);
    assert.match(rendered.html, /still waiting/i);
    assert.match(rendered.html, /37 Months/);
    assert.doesNotMatch(rendered.html, /1096 days/);
    assert.doesNotMatch(rendered.html, /-37 Months/);
    assert.match(
      rendered.html,
      /Your Priority Date has not reached the current cutoff yet/,
    );
    assert.doesNotMatch(
      rendered.html,
      /Your Priority Date is still waiting for Visa Bulletin movement/,
    );
    assert.doesNotMatch(rendered.html, /still unavailable/i);
    assert.doesNotMatch(rendered.html, /Invalid date/i);
    assert.ok(rendered.text.trim().length > 0);
    assert.match(rendered.text, /Now Available/i);
    assert.match(rendered.text, /Waiting/i);
    assert.ok(rendered.subject.length > 0);
  });

  it("preview API returns before Resend, campaign, and audit writes", () => {
    const routePath = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../app/api/admin/notifications/send-monthly-immigration-update/route.ts",
    );
    const source = readFileSync(routePath, "utf8");
    const previewIndex = source.indexOf('action === "preview"');
    const sendServiceIndex = source.indexOf("createNotificationService()");
    const auditIndex = source.indexOf("await writeSendAudit");
    assert.ok(previewIndex >= 0);
    assert.ok(sendServiceIndex > previewIndex);
    assert.ok(auditIndex > previewIndex);
    assert.match(source, /html: rendered\.html/);
    assert.match(source, /text: rendered\.text/);
  });
});

describe("employment email movement detail presentation", () => {
  it("retrogression movementLabel -37 Months → 37 Months", () => {
    assert.equal(
      formatEmploymentEmailMovementDetail("retrogression", "-37 Months"),
      "37 Months",
    );
  });

  it("advancement movementLabel +1 Month → 1 Month", () => {
    assert.equal(
      formatEmploymentEmailMovementDetail("forward", "+1 Month"),
      "1 Month",
    );
  });

  it("Now Available → —", () => {
    assert.equal(
      formatEmploymentEmailMovementDetail("now-available", "Now Available"),
      "—",
    );
  });

  it("Cutoff Introduced → —", () => {
    assert.equal(
      formatEmploymentEmailMovementDetail("cutoff-introduced", "Cutoff Introduced"),
      "—",
    );
  });
});

describe("employment waiting email copy", () => {
  it("uses approved waiting sentence without changing the monthly highlight", () => {
    const emailProps = mapMonthlyImmigrationReportEmailProps(TEST_SOURCE);
    assert.equal(emailProps.journeyType, "employment_gc_waiting");
    if (emailProps.journeyType !== "employment_gc_waiting") {
      return;
    }

    assert.equal(
      emailProps.advisorSummaryText,
      EMPLOYMENT_WAITING_EMAIL_ADVISOR_SUMMARY,
    );
    assert.equal(
      emailProps.journeyMeaningText,
      "The Final Action Date has not reached your Priority Date yet.",
    );
    assert.equal(
      mapMonthlyHighlight(TEST_JOURNEY, TEST_SOURCE.finalActionMovement),
      "This month: Final Action Now Available. Your case is still waiting.",
    );
    assert.equal(emailProps.monthlyHighlight, mapMonthlyHighlight(
      TEST_JOURNEY,
      TEST_SOURCE.finalActionMovement,
    ));
    assert.equal(emailProps.finalActionMovementDetail, "—");
    assert.equal(emailProps.dateForFilingMovementDetail, "37 Months");
    assert.equal(TEST_SOURCE.datesForFilingMovement?.movementLabel, "-37 Months");
  });
});

describe("green card citizenship mapping", () => {
  it("advisor copy remains citizenship remaining-days wording", () => {
    const summary = mapGreenCardAdvisorSummary({
      eligibilityStatus: "not_eligible_yet",
      summary: { daysRemaining: 120 },
    } as Parameters<typeof mapGreenCardAdvisorSummary>[0]);

    assert.match(summary, /citizenship journey is progressing as expected/i);
    assert.match(summary, /120 days/);
    assert.doesNotMatch(summary, /current cutoff/i);
  });
});
