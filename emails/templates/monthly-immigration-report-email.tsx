import type { CSSProperties } from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import {
  EMAIL_BRAND_NAME,
  EMAIL_LEGAL_DISCLAIMER,
  EMAIL_SUPPORT_ADDRESS,
  EmailLayout,
} from "../components/email-layout";

export const MONTHLY_IMMIGRATION_REPORT_TEMPLATE_ID =
  "monthly-immigration-report" as const;
export const MONTHLY_IMMIGRATION_REPORT_CTA_LABEL =
  "View My Immigration Dashboard";

/** Email-safe movement statuses for the Visa Bulletin Movement Tracker snapshot. */
export const VISA_BULLETIN_MOVEMENT_STATUSES = {
  ADVANCED: "advanced",
  UNCHANGED: "unchanged",
  RETROGRESSED: "retrogressed",
} as const;

export type VisaBulletinMovementStatus =
  (typeof VISA_BULLETIN_MOVEMENT_STATUSES)[keyof typeof VISA_BULLETIN_MOVEMENT_STATUSES];

const STATUS_COLOR = {
  waiting: "#ea580c",
  positive: "#059669",
  neutral: "#64748b",
  negative: "#dc2626",
} as const;

type MonthlyImmigrationReportEmailBaseProps = {
  firstName: string;
  dashboardUrl: string;
  /** Display month for subject / hero, e.g. "July 2026". */
  updateMonthLabel: string;
  /** One-line monthly takeaway shown in the highlight banner. */
  monthlyHighlight: string;
  /** Concise advisor next-step summary for Card 3. */
  advisorSummaryText: string;
  /** Optional layout width override (e.g. 100% for admin preview). */
  contentMaxWidth?: string;
};

export type EmploymentMonthlyImmigrationReportEmailProps =
  MonthlyImmigrationReportEmailBaseProps & {
    journeyType: "employment_gc_waiting";
    immigrationCategory: string;
    chargeabilityCountry: string;
    priorityDateDisplay: string;
    finalActionDateDisplay: string;
    finalActionStatus: string;
    dateForFilingDisplay: string;
    dateForFilingStatus: string;
    /** Short journey meaning shown inside Card 1. */
    journeyMeaningText: string;
    comparisonMonth: string;
    finalActionMovementDays: number;
    finalActionMovementStatus: VisaBulletinMovementStatus;
    dateForFilingMovementDays: number;
    dateForFilingMovementStatus: VisaBulletinMovementStatus;
  };

export type GreenCardMonthlyImmigrationReportEmailProps =
  MonthlyImmigrationReportEmailBaseProps & {
    journeyType: "green_card_holder";
    greenCardIssueDateDisplay: string;
    earliestFilingDateDisplay: string;
    daysRemaining: number;
    daysRemainingDisplay: string;
    /** Dashboard progress % — omit from UI when null. */
    progressPercent: number | null;
    journeyStatusLabel: string;
    todayDisplay: string;
    nextMilestoneLabel: string;
  };

export type MonthlyImmigrationReportEmailProps =
  | EmploymentMonthlyImmigrationReportEmailProps
  | GreenCardMonthlyImmigrationReportEmailProps;

const heroIntroStyle: CSSProperties = {
  color: "#334155",
  fontSize: "15px",
  lineHeight: "1.65",
  margin: "0 0 8px",
};

const heroSubIntroStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 600,
  lineHeight: "1.55",
  margin: "0 0 10px",
};

const profileLineStyle: CSSProperties = {
  color: "#1e40af",
  fontSize: "13px",
  fontWeight: 600,
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const highlightBannerStyle: CSSProperties = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  margin: "0 0 16px",
  padding: "14px 16px",
  width: "100%",
};

const highlightTextStyle: CSSProperties = {
  color: "#1e3a8a",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "1.55",
  margin: "0",
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  margin: "0 0 16px",
  overflow: "hidden",
};

const cardHeaderStyle: CSSProperties = {
  backgroundColor: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  padding: "12px 16px",
};

const cardHeaderTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  margin: "0",
  textTransform: "uppercase" as const,
};

const cardBodyStyle: CSSProperties = {
  padding: "14px 16px 16px",
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.03em",
  margin: "0 0 2px",
  textTransform: "uppercase" as const,
};

const valueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  lineHeight: "1.45",
  margin: "0 0 12px",
};

const valueStyleLast: CSSProperties = {
  ...valueStyle,
  margin: "0",
};

const threeColLeftStyle: CSSProperties = {
  paddingRight: "6px",
  verticalAlign: "top",
  width: "33.33%",
};

const threeColMiddleStyle: CSSProperties = {
  paddingLeft: "6px",
  paddingRight: "6px",
  verticalAlign: "top",
  width: "33.33%",
};

const threeColRightStyle: CSSProperties = {
  paddingLeft: "6px",
  verticalAlign: "top",
  width: "33.33%",
};

const twoColLeftStyle: CSSProperties = {
  paddingRight: "8px",
  verticalAlign: "top",
  width: "50%",
};

const twoColRightStyle: CSSProperties = {
  paddingLeft: "8px",
  verticalAlign: "top",
  width: "50%",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid #e2e8f0",
  margin: "4px 0 12px",
};

const meaningStyle: CSSProperties = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "1.55",
  margin: "0",
};

const movementDaysStyleLast: CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  lineHeight: "1.4",
  margin: "0",
};

const advisorStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
};

/** Subject: IMMIFIN | Your {Month Year} Immigration Update */
export function buildMonthlyImmigrationReportSubject(
  updateMonthLabel: string
): string {
  const month = updateMonthLabel.trim() || "Monthly";
  return `IMMIFIN | Your ${month} Immigration Update`;
}

/** Concise personalized profile summary for employment journey hero. */
export function buildPersonalizedProfileLine(
  immigrationCategory: string,
  chargeabilityCountry: string,
  priorityDateDisplay: string
): string {
  return `${immigrationCategory.trim()} • ${chargeabilityCountry.trim()} • Priority Date ${priorityDateDisplay.trim()}`;
}

/** Concise personalized profile summary for Green Card holder hero. */
export function buildGreenCardProfileLine(
  greenCardIssueDateDisplay: string
): string {
  return `Green Card Holder • Issue Date ${greenCardIssueDateDisplay.trim()}`;
}

export function resolveEligibilityStatusColor(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (
    normalized.includes("eligible") ||
    normalized.includes("current")
  ) {
    return STATUS_COLOR.positive;
  }
  if (
    normalized.includes("waiting") ||
    normalized.includes("pending") ||
    normalized.includes("on track")
  ) {
    return STATUS_COLOR.waiting;
  }
  return STATUS_COLOR.neutral;
}

export function resolveMovementStatusColor(
  status: VisaBulletinMovementStatus
): string {
  switch (status) {
    case VISA_BULLETIN_MOVEMENT_STATUSES.ADVANCED:
      return STATUS_COLOR.positive;
    case VISA_BULLETIN_MOVEMENT_STATUSES.RETROGRESSED:
      return STATUS_COLOR.negative;
    case VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED:
      return STATUS_COLOR.neutral;
    default:
      return STATUS_COLOR.neutral;
  }
}

export function formatVisaBulletinMovementIndicator(
  status: VisaBulletinMovementStatus
): string {
  switch (status) {
    case VISA_BULLETIN_MOVEMENT_STATUSES.ADVANCED:
      return "▲ Advanced";
    case VISA_BULLETIN_MOVEMENT_STATUSES.RETROGRESSED:
      return "▼ Retrogressed";
    case VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED:
      return "▬ No Movement";
    default:
      return "▬ No Movement";
  }
}

export function formatVisaBulletinMovementDays(
  status: VisaBulletinMovementStatus,
  days: number
): string {
  if (status === VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED) {
    return "0 days";
  }
  return `${Math.abs(Math.trunc(days))} days`;
}

/** Text-only movement status for plain-text fallback (no decorative glyphs). */
export function formatVisaBulletinMovementStatusText(
  status: VisaBulletinMovementStatus
): string {
  switch (status) {
    case VISA_BULLETIN_MOVEMENT_STATUSES.ADVANCED:
      return "Advanced";
    case VISA_BULLETIN_MOVEMENT_STATUSES.RETROGRESSED:
      return "Retrogressed";
    case VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED:
      return "No Movement";
    default:
      return "No Movement";
  }
}

/** Combined label for plain-text / legacy callers. */
export function formatVisaBulletinMovementLabel(
  status: VisaBulletinMovementStatus,
  days: number
): string {
  const statusText = formatVisaBulletinMovementStatusText(status);
  if (status === VISA_BULLETIN_MOVEMENT_STATUSES.UNCHANGED) {
    return statusText;
  }
  return `${statusText} · ${formatVisaBulletinMovementDays(status, days)}`;
}

function EmploymentJourneyCards(
  props: EmploymentMonthlyImmigrationReportEmailProps
) {
  const finalActionStatusColor = resolveEligibilityStatusColor(
    props.finalActionStatus
  );
  const dateForFilingStatusColor = resolveEligibilityStatusColor(
    props.dateForFilingStatus
  );
  const finalActionMovementColor = resolveMovementStatusColor(
    props.finalActionMovementStatus
  );
  const dateForFilingMovementColor = resolveMovementStatusColor(
    props.dateForFilingMovementStatus
  );

  return (
    <>
      <Section style={cardStyle}>
        <Section style={cardHeaderStyle}>
          <Text style={cardHeaderTitleStyle}>
            Your Immigration Journey Today
          </Text>
        </Section>
        <Section style={cardBodyStyle}>
          <Row>
            <Column style={threeColLeftStyle}>
              <Text style={labelStyle}>Immigration Category</Text>
              <Text style={valueStyle}>{props.immigrationCategory.trim()}</Text>
            </Column>
            <Column style={threeColMiddleStyle}>
              <Text style={labelStyle}>Chargeability Country</Text>
              <Text style={valueStyle}>{props.chargeabilityCountry.trim()}</Text>
            </Column>
            <Column style={threeColRightStyle}>
              <Text style={labelStyle}>Priority Date</Text>
              <Text style={valueStyle}>{props.priorityDateDisplay.trim()}</Text>
            </Column>
          </Row>
          <Row>
            <Column style={threeColLeftStyle}>
              <Text style={labelStyle}>Final Action Date</Text>
              <Text style={valueStyle}>
                {props.finalActionDateDisplay.trim()}
              </Text>
              <Text
                style={{
                  color: finalActionStatusColor,
                  fontSize: "13px",
                  fontWeight: 700,
                  lineHeight: "1.4",
                  margin: "0 0 12px",
                }}
              >
                ● {props.finalActionStatus.trim()}
              </Text>
            </Column>
            <Column style={threeColMiddleStyle}>
              <Text style={labelStyle}>Date for Filing</Text>
              <Text style={valueStyle}>
                {props.dateForFilingDisplay.trim()}
              </Text>
              <Text
                style={{
                  color: dateForFilingStatusColor,
                  fontSize: "13px",
                  fontWeight: 700,
                  lineHeight: "1.4",
                  margin: "0 0 12px",
                }}
              >
                ● {props.dateForFilingStatus.trim()}
              </Text>
            </Column>
            <Column style={threeColRightStyle}>
              <Text style={{ margin: "0" }}>&nbsp;</Text>
            </Column>
          </Row>
          <Section style={dividerStyle} />
          <Text style={labelStyle}>What this means</Text>
          <Text style={meaningStyle}>{props.journeyMeaningText.trim()}</Text>
        </Section>
      </Section>

      <Section style={cardStyle}>
        <Section style={cardHeaderStyle}>
          <Text style={cardHeaderTitleStyle}>
            This Month&apos;s Visa Bulletin Movement
          </Text>
        </Section>
        <Section style={cardBodyStyle}>
          <Row>
            <Column style={threeColLeftStyle}>
              <Text style={labelStyle}>Compared with</Text>
              <Text style={valueStyleLast}>{props.comparisonMonth.trim()}</Text>
            </Column>
            <Column style={threeColMiddleStyle}>
              <Text style={labelStyle}>Final Action</Text>
              <Text
                style={{
                  color: finalActionMovementColor,
                  fontSize: "15px",
                  fontWeight: 700,
                  lineHeight: "1.4",
                  margin: "0 0 4px",
                }}
              >
                {formatVisaBulletinMovementIndicator(
                  props.finalActionMovementStatus
                )}
              </Text>
              <Text style={movementDaysStyleLast}>
                {formatVisaBulletinMovementDays(
                  props.finalActionMovementStatus,
                  props.finalActionMovementDays
                )}
              </Text>
            </Column>
            <Column style={threeColRightStyle}>
              <Text style={labelStyle}>Date for Filing</Text>
              <Text
                style={{
                  color: dateForFilingMovementColor,
                  fontSize: "15px",
                  fontWeight: 700,
                  lineHeight: "1.4",
                  margin: "0 0 4px",
                }}
              >
                {formatVisaBulletinMovementIndicator(
                  props.dateForFilingMovementStatus
                )}
              </Text>
              <Text style={movementDaysStyleLast}>
                {formatVisaBulletinMovementDays(
                  props.dateForFilingMovementStatus,
                  props.dateForFilingMovementDays
                )}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>
    </>
  );
}

function GreenCardJourneyCards(
  props: GreenCardMonthlyImmigrationReportEmailProps
) {
  const statusColor = resolveEligibilityStatusColor(props.journeyStatusLabel);
  const showProgress =
    props.progressPercent != null && Number.isFinite(props.progressPercent);

  return (
    <>
      <Section style={cardStyle}>
        <Section style={cardHeaderStyle}>
          <Text style={cardHeaderTitleStyle}>Your Citizenship Journey</Text>
        </Section>
        <Section style={cardBodyStyle}>
          <Row>
            <Column style={twoColLeftStyle}>
              <Text style={labelStyle}>Green Card Issue Date</Text>
              <Text style={valueStyle}>
                {props.greenCardIssueDateDisplay.trim()}
              </Text>
            </Column>
            <Column style={twoColRightStyle}>
              <Text style={labelStyle}>Earliest N-400 Filing Date</Text>
              <Text style={valueStyle}>
                {props.earliestFilingDateDisplay.trim()}
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={twoColLeftStyle}>
              <Text style={labelStyle}>Days Remaining</Text>
              <Text style={valueStyle}>{props.daysRemainingDisplay.trim()}</Text>
            </Column>
            <Column style={twoColRightStyle}>
              <Text style={labelStyle}>Current Journey Status</Text>
              <Text
                style={{
                  color: statusColor,
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: "1.45",
                  margin: showProgress ? "0 0 12px" : "0",
                }}
              >
                ● {props.journeyStatusLabel.trim()}
              </Text>
            </Column>
          </Row>
          {showProgress ? (
            <>
              <Section style={dividerStyle} />
              <Text style={labelStyle}>Estimated Citizenship Progress</Text>
              <Text style={valueStyleLast}>
                {Math.round(props.progressPercent!)}%
              </Text>
            </>
          ) : null}
        </Section>
      </Section>

      <Section style={cardStyle}>
        <Section style={cardHeaderStyle}>
          <Text style={cardHeaderTitleStyle}>Your Citizenship Timeline</Text>
        </Section>
        <Section style={cardBodyStyle}>
          <Row>
            <Column style={twoColLeftStyle}>
              <Text style={labelStyle}>Today</Text>
              <Text style={valueStyle}>{props.todayDisplay.trim()}</Text>
            </Column>
            <Column style={twoColRightStyle}>
              <Text style={labelStyle}>Earliest Filing Date</Text>
              <Text style={valueStyle}>
                {props.earliestFilingDateDisplay.trim()}
              </Text>
            </Column>
          </Row>
          <Row>
            <Column style={twoColLeftStyle}>
              <Text style={labelStyle}>Remaining Days</Text>
              <Text style={valueStyleLast}>
                {props.daysRemainingDisplay.trim()}
              </Text>
            </Column>
            <Column style={twoColRightStyle}>
              <Text style={labelStyle}>Next Milestone</Text>
              <Text style={valueStyleLast}>
                {props.nextMilestoneLabel.trim()}
              </Text>
            </Column>
          </Row>
        </Section>
      </Section>
    </>
  );
}

/**
 * Flagship Monthly Immigration Update — personalized mini-dashboard for inbox.
 * Three-card layout: Journey, Timeline/Movement, Advisor. Journey-aware content.
 */
export function MonthlyImmigrationReportEmail(
  props: MonthlyImmigrationReportEmailProps
) {
  const monthLabel = props.updateMonthLabel.trim() || "this month";
  const isGreenCard = props.journeyType === "green_card_holder";
  const profileLine = isGreenCard
    ? buildGreenCardProfileLine(props.greenCardIssueDateDisplay)
    : buildPersonalizedProfileLine(
        props.immigrationCategory,
        props.chargeabilityCountry,
        props.priorityDateDisplay
      );
  const heroIntro = isGreenCard
    ? "We've prepared this month's update specifically for your citizenship journey."
    : "We've analyzed this month's Visa Bulletin specifically for your immigration journey.";

  return (
    <EmailLayout
      previewText={`Your ${monthLabel} IMMIFIN immigration update — where you are, what changed, and what to do next.`}
      title={`Your ${monthLabel} Immigration Update`}
      firstName={props.firstName}
      ctaLabel={MONTHLY_IMMIGRATION_REPORT_CTA_LABEL}
      ctaUrl={props.dashboardUrl}
      contentMaxWidth={props.contentMaxWidth}
    >
      <Text style={heroIntroStyle}>{heroIntro}</Text>
      <Text style={heroSubIntroStyle}>
        Here&apos;s everything you need to know in less than one minute.
      </Text>
      <Text style={profileLineStyle}>{profileLine}</Text>

      <Section style={highlightBannerStyle}>
        <Text style={highlightTextStyle}>
          📌 {props.monthlyHighlight.trim()}
        </Text>
      </Section>

      {isGreenCard ? (
        <GreenCardJourneyCards {...props} />
      ) : (
        <EmploymentJourneyCards {...props} />
      )}

      <Section style={cardStyle}>
        <Section style={cardHeaderStyle}>
          <Text style={cardHeaderTitleStyle}>What This Means for You</Text>
        </Section>
        <Section style={cardBodyStyle}>
          <Text style={advisorStyle}>{props.advisorSummaryText.trim()}</Text>
        </Section>
      </Section>
    </EmailLayout>
  );
}

/** Plain-text fallback for Monthly Immigration Update (multipart alternative). */
export function buildMonthlyImmigrationReportPlainText(
  props: MonthlyImmigrationReportEmailProps
): string {
  const greetingName = props.firstName.trim() || "there";
  const monthLabel = props.updateMonthLabel.trim() || "this month";

  if (props.journeyType === "green_card_holder") {
    const progressLine =
      props.progressPercent != null && Number.isFinite(props.progressPercent)
        ? `Estimated Citizenship Progress: ${Math.round(props.progressPercent)}%`
        : null;

    return [
      `${EMAIL_BRAND_NAME}`,
      "",
      `Your ${monthLabel} Immigration Update`,
      "",
      `Hello ${greetingName},`,
      "",
      "We've prepared this month's update specifically for your citizenship journey.",
      "Here's everything you need to know in less than one minute.",
      "",
      buildGreenCardProfileLine(props.greenCardIssueDateDisplay),
      "",
      props.monthlyHighlight.trim(),
      "",
      "YOUR CITIZENSHIP JOURNEY",
      `Green Card Issue Date: ${props.greenCardIssueDateDisplay.trim()}`,
      `Earliest N-400 Filing Date: ${props.earliestFilingDateDisplay.trim()}`,
      `Days Remaining: ${props.daysRemainingDisplay.trim()}`,
      `Current Journey Status: ${props.journeyStatusLabel.trim()}`,
      ...(progressLine ? [progressLine] : []),
      "",
      "YOUR CITIZENSHIP TIMELINE",
      `Today: ${props.todayDisplay.trim()}`,
      `Earliest Filing Date: ${props.earliestFilingDateDisplay.trim()}`,
      `Remaining Days: ${props.daysRemainingDisplay.trim()}`,
      `Next Milestone: ${props.nextMilestoneLabel.trim()}`,
      "",
      "WHAT THIS MEANS FOR YOU",
      props.advisorSummaryText.trim(),
      "",
      `${MONTHLY_IMMIGRATION_REPORT_CTA_LABEL}: ${props.dashboardUrl}`,
      "",
      EMAIL_LEGAL_DISCLAIMER,
      "",
      `Questions? Reply to this email or contact ${EMAIL_SUPPORT_ADDRESS}.`,
      "",
      `© ${new Date().getFullYear()} ${EMAIL_BRAND_NAME}`,
    ].join("\n");
  }

  return [
    `${EMAIL_BRAND_NAME}`,
    "",
    `Your ${monthLabel} Immigration Update`,
    "",
    `Hello ${greetingName},`,
    "",
    "We've analyzed this month's Visa Bulletin specifically for your immigration journey.",
    "Here's everything you need to know in less than one minute.",
    "",
    buildPersonalizedProfileLine(
      props.immigrationCategory,
      props.chargeabilityCountry,
      props.priorityDateDisplay
    ),
    "",
    props.monthlyHighlight.trim(),
    "",
    "YOUR IMMIGRATION JOURNEY TODAY",
    `Immigration Category: ${props.immigrationCategory.trim()}`,
    `Chargeability Country: ${props.chargeabilityCountry.trim()}`,
    `Priority Date: ${props.priorityDateDisplay.trim()}`,
    `Final Action Date: ${props.finalActionDateDisplay.trim()}`,
    `Final Action Status: ${props.finalActionStatus.trim()}`,
    `Date for Filing: ${props.dateForFilingDisplay.trim()}`,
    `Date for Filing Status: ${props.dateForFilingStatus.trim()}`,
    `What this means: ${props.journeyMeaningText.trim()}`,
    "",
    "THIS MONTH'S VISA BULLETIN MOVEMENT",
    `Compared with: ${props.comparisonMonth.trim()}`,
    `Final Action: ${formatVisaBulletinMovementLabel(props.finalActionMovementStatus, props.finalActionMovementDays)}`,
    `Date for Filing: ${formatVisaBulletinMovementLabel(props.dateForFilingMovementStatus, props.dateForFilingMovementDays)}`,
    "",
    "WHAT THIS MEANS FOR YOU",
    props.advisorSummaryText.trim(),
    "",
    `${MONTHLY_IMMIGRATION_REPORT_CTA_LABEL}: ${props.dashboardUrl}`,
    "",
    EMAIL_LEGAL_DISCLAIMER,
    "",
    `Questions? Reply to this email or contact ${EMAIL_SUPPORT_ADDRESS}.`,
    "",
    `© ${new Date().getFullYear()} ${EMAIL_BRAND_NAME}`,
  ].join("\n");
}

export type MonthlyImmigrationReportRenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Render HTML + plain text for Notification Service / adapters. */
export async function renderMonthlyImmigrationReportEmail(
  props: MonthlyImmigrationReportEmailProps
): Promise<MonthlyImmigrationReportRenderedEmail> {
  const html = await render(<MonthlyImmigrationReportEmail {...props} />);
  const text = buildMonthlyImmigrationReportPlainText(props);

  return {
    subject: buildMonthlyImmigrationReportSubject(props.updateMonthLabel),
    html,
    text,
  };
}
