import type { CSSProperties, ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export const EMAIL_BRAND_NAME = "IMMIFIN";
export const EMAIL_SUPPORT_ADDRESS = "support@immifin.com";
export const EMAIL_LEGAL_DISCLAIMER =
  "This email is provided for informational purposes only and does not constitute legal advice.";

const BRAND_ACCENT = "#1d4ed8";
const TEXT_PRIMARY = "#0f172a";
const TEXT_MUTED = "#475569";
const BORDER = "#e2e8f0";
const BACKGROUND = "#eef4fb";
const CARD_BACKGROUND = "#ffffff";

export type EmailLayoutProps = {
  previewText: string;
  title: string;
  firstName: string;
  ctaLabel: string;
  ctaUrl: string;
  children: ReactNode;
  supportEmail?: string;
  /** Email content width. Defaults to 640px; use 100% for admin preview. */
  contentMaxWidth?: string;
};

/**
 * Shared IMMIFIN email shell — brand, greeting, CTA, disclaimer, support, copyright.
 * Templates supply title, greeting name, body content, and one primary CTA.
 */
export function EmailLayout({
  previewText,
  title,
  firstName,
  ctaLabel,
  ctaUrl,
  children,
  supportEmail = EMAIL_SUPPORT_ADDRESS,
  contentMaxWidth = "640px",
}: EmailLayoutProps) {
  const greetingName = firstName.trim() || "there";
  const year = new Date().getFullYear();
  const container: CSSProperties = {
    ...containerStyle,
    maxWidth: contentMaxWidth,
  };

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={container}>
          <Section style={headerStyle}>
            <Text style={brandStyle}>{EMAIL_BRAND_NAME}</Text>
          </Section>

          <Section style={contentStyle}>
            <Heading as="h1" style={titleStyle}>
              {title}
            </Heading>

            <Text style={greetingStyle}>Hi {greetingName},</Text>

            <Section style={mainStyle}>{children}</Section>

            <Section style={ctaSectionStyle}>
              <Button href={ctaUrl} style={ctaButtonStyle}>
                {ctaLabel}
              </Button>
            </Section>
          </Section>

          <Hr style={hrStyle} />

          <Section style={footerStyle}>
            <Text style={disclaimerStyle}>{EMAIL_LEGAL_DISCLAIMER}</Text>
            <Text style={footerTextStyle}>
              Questions? Reply to this email or contact{" "}
              <Link href={`mailto:${supportEmail}`} style={linkStyle}>
                {supportEmail}
              </Link>
              .
            </Text>
            <Text style={copyrightStyle}>
              © {year} {EMAIL_BRAND_NAME}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: CSSProperties = {
  backgroundColor: BACKGROUND,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "24px 12px",
};

const containerStyle: CSSProperties = {
  backgroundColor: CARD_BACKGROUND,
  border: `1px solid ${BORDER}`,
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "640px",
  width: "100%",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  backgroundColor: BRAND_ACCENT,
  padding: "20px 28px",
};

const brandStyle: CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  margin: "0",
};

const contentStyle: CSSProperties = {
  padding: "28px 28px 8px",
};

const titleStyle: CSSProperties = {
  color: TEXT_PRIMARY,
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 16px",
};

const greetingStyle: CSSProperties = {
  color: TEXT_PRIMARY,
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const mainStyle: CSSProperties = {
  margin: "0 0 8px",
};

const ctaSectionStyle: CSSProperties = {
  margin: "24px 0 8px",
  textAlign: "left" as const,
};

const ctaButtonStyle: CSSProperties = {
  backgroundColor: BRAND_ACCENT,
  borderRadius: "10px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 20px",
  textDecoration: "none",
};

const hrStyle: CSSProperties = {
  borderColor: BORDER,
  borderTop: `1px solid ${BORDER}`,
  margin: "8px 28px",
};

const footerStyle: CSSProperties = {
  padding: "8px 28px 24px",
};

const disclaimerStyle: CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const footerTextStyle: CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 12px",
};

const copyrightStyle: CSSProperties = {
  color: TEXT_MUTED,
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0",
};

const linkStyle: CSSProperties = {
  color: BRAND_ACCENT,
  textDecoration: "underline",
};
