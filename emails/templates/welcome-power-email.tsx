import type { CSSProperties } from "react";
import { Link, Text } from "@react-email/components";
import { render } from "@react-email/render";
import {
  EMAIL_BRAND_NAME,
  EMAIL_LEGAL_DISCLAIMER,
  EMAIL_SUPPORT_ADDRESS,
  EmailLayout,
} from "../components/email-layout";

export const WELCOME_POWER_TEMPLATE_ID = "welcome-power" as const;
export const WELCOME_POWER_SUBJECT = "IMMIFIN | Welcome to Power";
export const WELCOME_POWER_CTA_LABEL = "View My Dashboard";

export type WelcomePowerEmailProps = {
  firstName: string;
  dashboardUrl: string;
  immigrationCategory?: string;
  chargeabilityCountry?: string;
  priorityDateDisplay?: string;
};

const bodyTextStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 14px",
};

const listItemStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 8px",
  paddingLeft: "4px",
};

const metaLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.02em",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};

const metaValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

/**
 * Welcome Power lifecycle email — uses shared EmailLayout.
 * Does not call Resend or any provider.
 */
export function WelcomePowerEmail({
  firstName,
  dashboardUrl,
  immigrationCategory,
  chargeabilityCountry,
  priorityDateDisplay,
}: WelcomePowerEmailProps) {
  const hasJourneyMeta =
    Boolean(immigrationCategory?.trim()) ||
    Boolean(chargeabilityCountry?.trim()) ||
    Boolean(priorityDateDisplay?.trim());

  return (
    <EmailLayout
      previewText="Welcome to IMMIFIN Power — AI-powered immigration insights await."
      title="Welcome to IMMIFIN Power"
      firstName={firstName}
      ctaLabel={WELCOME_POWER_CTA_LABEL}
      ctaUrl={dashboardUrl}
    >
      <Text style={bodyTextStyle}>
        You are now enrolled in <strong>IMMIFIN Power</strong>. Your advanced
        personalized dashboard is ready whenever you are.
      </Text>

      <Text style={bodyTextStyle}>With Power, you have access to:</Text>
      <Text style={listItemStyle}>• Everything included in Pro</Text>
      <Text style={listItemStyle}>• AI-powered immigration insights</Text>
      <Text style={listItemStyle}>• Multiple immigration profiles</Text>
      <Text style={listItemStyle}>• Advanced personalized dashboard</Text>
      <Text style={listItemStyle}>• Priority support</Text>

      <Text style={bodyTextStyle}>
        After each Visa Bulletin refresh, you can expect a monthly personalized
        immigration report based on your immigration journey and profile — with
        Power-tier intelligence as those features ship.
      </Text>

      {hasJourneyMeta ? (
        <>
          <Text style={bodyTextStyle}>
            We will use the journey details on your profile to personalize those
            updates:
          </Text>
          {immigrationCategory?.trim() ? (
            <>
              <Text style={metaLabelStyle}>Category</Text>
              <Text style={metaValueStyle}>{immigrationCategory.trim()}</Text>
            </>
          ) : null}
          {chargeabilityCountry?.trim() ? (
            <>
              <Text style={metaLabelStyle}>Chargeability country</Text>
              <Text style={metaValueStyle}>{chargeabilityCountry.trim()}</Text>
            </>
          ) : null}
          {priorityDateDisplay?.trim() ? (
            <>
              <Text style={metaLabelStyle}>Priority date</Text>
              <Text style={metaValueStyle}>{priorityDateDisplay.trim()}</Text>
            </>
          ) : null}
        </>
      ) : (
        <Text style={bodyTextStyle}>
          Keep your immigration profile up to date so future reports stay
          accurate.
        </Text>
      )}

      <Text style={bodyTextStyle}>
        Open your dashboard to review your journey and Power tools:{" "}
        <Link href={dashboardUrl} style={{ color: "#1d4ed8" }}>
          {dashboardUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

/** Plain-text fallback for Welcome Power (multipart alternative). */
export function buildWelcomePowerPlainText({
  firstName,
  dashboardUrl,
  immigrationCategory,
  chargeabilityCountry,
  priorityDateDisplay,
}: WelcomePowerEmailProps): string {
  const greetingName = firstName.trim() || "there";
  const lines = [
    `${EMAIL_BRAND_NAME}`,
    "",
    "Welcome to IMMIFIN Power",
    "",
    `Hi ${greetingName},`,
    "",
    "You are now enrolled in IMMIFIN Power. Your advanced personalized dashboard is ready whenever you are.",
    "",
    "With Power, you have access to:",
    "• Everything included in Pro",
    "• AI-powered immigration insights",
    "• Multiple immigration profiles",
    "• Advanced personalized dashboard",
    "• Priority support",
    "",
    "After each Visa Bulletin refresh, you can expect a monthly personalized immigration report based on your immigration journey and profile — with Power-tier intelligence as those features ship.",
    "",
  ];

  if (immigrationCategory?.trim()) {
    lines.push(`Category: ${immigrationCategory.trim()}`, "");
  }
  if (chargeabilityCountry?.trim()) {
    lines.push(`Chargeability country: ${chargeabilityCountry.trim()}`, "");
  }
  if (priorityDateDisplay?.trim()) {
    lines.push(`Priority date: ${priorityDateDisplay.trim()}`, "");
  }

  lines.push(
    `${WELCOME_POWER_CTA_LABEL}: ${dashboardUrl}`,
    "",
    EMAIL_LEGAL_DISCLAIMER,
    "",
    `Questions? Reply to this email or contact ${EMAIL_SUPPORT_ADDRESS}.`,
    "",
    `© ${new Date().getFullYear()} ${EMAIL_BRAND_NAME}`
  );

  return lines.join("\n");
}

export type WelcomePowerRenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Render HTML + plain text for Notification Service / adapters. */
export async function renderWelcomePowerEmail(
  props: WelcomePowerEmailProps
): Promise<WelcomePowerRenderedEmail> {
  const html = await render(<WelcomePowerEmail {...props} />);
  const text = buildWelcomePowerPlainText(props);

  return {
    subject: WELCOME_POWER_SUBJECT,
    html,
    text,
  };
}
