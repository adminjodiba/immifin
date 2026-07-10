import type { CSSProperties } from "react";
import { Link, Text } from "@react-email/components";
import { render } from "@react-email/render";
import {
  EMAIL_BRAND_NAME,
  EMAIL_LEGAL_DISCLAIMER,
  EMAIL_SUPPORT_ADDRESS,
  EmailLayout,
} from "../components/email-layout";

export const WELCOME_PRO_TEMPLATE_ID = "welcome-pro" as const;
export const WELCOME_PRO_SUBJECT = "IMMIFIN | Welcome to Pro";
export const WELCOME_PRO_CTA_LABEL = "View My Dashboard";

export type WelcomeProEmailProps = {
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
 * Welcome Pro lifecycle email — uses shared EmailLayout.
 * Does not call Resend or any provider.
 */
export function WelcomeProEmail({
  firstName,
  dashboardUrl,
  immigrationCategory,
  chargeabilityCountry,
  priorityDateDisplay,
}: WelcomeProEmailProps) {
  const hasJourneyMeta =
    Boolean(immigrationCategory?.trim()) ||
    Boolean(chargeabilityCountry?.trim()) ||
    Boolean(priorityDateDisplay?.trim());

  return (
    <EmailLayout
      previewText="Welcome to IMMIFIN Pro — your personalized dashboard is ready."
      title="Welcome to IMMIFIN Pro"
      firstName={firstName}
      ctaLabel={WELCOME_PRO_CTA_LABEL}
      ctaUrl={dashboardUrl}
    >
      <Text style={bodyTextStyle}>
        You are now enrolled in <strong>IMMIFIN Pro</strong>. Your personalized
        dashboard is ready whenever you are.
      </Text>

      <Text style={bodyTextStyle}>
        After each Visa Bulletin refresh, you can expect a monthly personalized
        immigration report based on your immigration journey and profile.
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
        Open your dashboard to review your journey and Pro tools:{" "}
        <Link href={dashboardUrl} style={{ color: "#1d4ed8" }}>
          {dashboardUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

/** Plain-text fallback for Welcome Pro (multipart alternative). */
export function buildWelcomeProPlainText({
  firstName,
  dashboardUrl,
  immigrationCategory,
  chargeabilityCountry,
  priorityDateDisplay,
}: WelcomeProEmailProps): string {
  const greetingName = firstName.trim() || "there";
  const lines = [
    `${EMAIL_BRAND_NAME}`,
    "",
    "Welcome to IMMIFIN Pro",
    "",
    `Hi ${greetingName},`,
    "",
    "You are now enrolled in IMMIFIN Pro. Your personalized dashboard is ready whenever you are.",
    "",
    "After each Visa Bulletin refresh, you can expect a monthly personalized immigration report based on your immigration journey and profile.",
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
    `${WELCOME_PRO_CTA_LABEL}: ${dashboardUrl}`,
    "",
    EMAIL_LEGAL_DISCLAIMER,
    "",
    `Questions? Reply to this email or contact ${EMAIL_SUPPORT_ADDRESS}.`,
    "",
    `© ${new Date().getFullYear()} ${EMAIL_BRAND_NAME}`
  );

  return lines.join("\n");
}

export type WelcomeProRenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Render HTML + plain text for Notification Service / adapters. */
export async function renderWelcomeProEmail(
  props: WelcomeProEmailProps
): Promise<WelcomeProRenderedEmail> {
  const html = await render(<WelcomeProEmail {...props} />);
  const text = buildWelcomeProPlainText(props);

  return {
    subject: WELCOME_PRO_SUBJECT,
    html,
    text,
  };
}
