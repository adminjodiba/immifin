import type { CSSProperties } from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import { render } from "@react-email/render";
import { EMAIL_BRAND_NAME } from "../components/email-layout";
import type { ContactReason } from "@/lib/contact";
import { getContactReasonLabel } from "@/lib/contact";

export const CONTACT_REQUEST_TEMPLATE_ID = "contact-request" as const;

export type ContactRequestEmailProps = {
  reason: ContactReason;
  subject: string;
  message: string;
  senderName: string;
  senderEmail: string;
  isSignedIn: boolean;
  planLabel: string | null;
  submittedAtIso: string;
  environmentLabel: string;
};

function buildContactSubject(props: ContactRequestEmailProps): string {
  const reasonLabel = getContactReasonLabel(props.reason);
  return `IMMIFIN Contact | ${reasonLabel} | ${props.subject}`;
}

export function buildContactRequestPlainText(props: ContactRequestEmailProps): string {
  const reasonLabel = getContactReasonLabel(props.reason);
  const lines = [
    "IMMIFIN Contact Request",
    "",
    `Reason: ${reasonLabel}`,
    `Subject: ${props.subject}`,
    "",
    "Message:",
    props.message,
    "",
    `Sender name: ${props.senderName}`,
    `Sender email: ${props.senderEmail}`,
    `Signed in: ${props.isSignedIn ? "Yes" : "No"}`,
    props.planLabel ? `Plan: ${props.planLabel}` : null,
    `Submitted at: ${props.submittedAtIso}`,
    "Source: Contact Us",
    `Environment: ${props.environmentLabel}`,
  ];

  return lines.filter((line) => line !== null).join("\n");
}

function ContactRequestEmail(props: ContactRequestEmailProps) {
  const reasonLabel = getContactReasonLabel(props.reason);
  const preview = `${reasonLabel}: ${props.subject}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>{EMAIL_BRAND_NAME}</Text>
          </Section>

          <Section style={cardStyle}>
            <Heading as="h1" style={titleStyle}>
              Contact Request
            </Heading>
            <Text style={mutedStyle}>Internal routing email from the Contact Us page.</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Contact reason</Text>
            <Text style={valueStyle}>{reasonLabel}</Text>

            <Text style={labelStyle}>Subject</Text>
            <Text style={valueStyle}>{props.subject}</Text>

            <Text style={labelStyle}>Message</Text>
            <Text style={messageStyle}>{props.message}</Text>

            <Hr style={hrStyle} />

            <Text style={labelStyle}>Sender name</Text>
            <Text style={valueStyle}>{props.senderName}</Text>

            <Text style={labelStyle}>Sender email</Text>
            <Text style={valueStyle}>{props.senderEmail}</Text>

            <Text style={labelStyle}>Signed-in account</Text>
            <Text style={valueStyle}>{props.isSignedIn ? "Yes" : "No"}</Text>

            {props.planLabel ? (
              <>
                <Text style={labelStyle}>Plan</Text>
                <Text style={valueStyle}>{props.planLabel}</Text>
              </>
            ) : null}

            <Text style={labelStyle}>Submitted at</Text>
            <Text style={valueStyle}>{props.submittedAtIso}</Text>

            <Text style={labelStyle}>Source</Text>
            <Text style={valueStyle}>Contact Us</Text>

            <Text style={labelStyle}>Environment</Text>
            <Text style={valueStyle}>{props.environmentLabel}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderContactRequestEmail(props: ContactRequestEmailProps): Promise<{
  subject: string;
  html: string;
  text: string;
}> {
  const html = await render(<ContactRequestEmail {...props} />);

  return {
    subject: buildContactSubject(props),
    html,
    text: buildContactRequestPlainText(props),
  };
}

const bodyStyle: CSSProperties = {
  backgroundColor: "#eef4fb",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: "24px 12px",
};

const containerStyle: CSSProperties = {
  margin: "0 auto",
  maxWidth: "640px",
};

const headerStyle: CSSProperties = {
  padding: "8px 4px 16px",
};

const brandStyle: CSSProperties = {
  color: "#1d4ed8",
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: 0,
};

const cardStyle: CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "24px",
};

const titleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 8px",
};

const mutedStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  margin: "0 0 8px",
};

const labelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: "14px 0 4px",
  textTransform: "uppercase",
};

const valueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const messageStyle: CSSProperties = {
  ...valueStyle,
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "12px",
};

const hrStyle: CSSProperties = {
  borderColor: "#e2e8f0",
  borderTop: "1px solid #e2e8f0",
  margin: "18px 0",
};
