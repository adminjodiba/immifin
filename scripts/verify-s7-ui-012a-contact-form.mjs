/**
 * S7-UI-012A — Unified contact form + server-side routing.
 * Run: npx tsx scripts/verify-s7-ui-012a-contact-form.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONTACT_REASON_DEFINITIONS,
  CONTACT_REASONS,
  contactConfig,
  resolveContactRecipient,
  validateContactSubmission,
} from "../lib/contact.ts";
import { PUBLIC_ROUTE_PATTERNS, isPublicLandingPath } from "../lib/auth/publicRoutes.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  assert("Five approved contact reasons", CONTACT_REASONS.length === 5);
  assert(
    "Reason labels approved",
    CONTACT_REASON_DEFINITIONS.map((r) => r.label).join("|") ===
      "General Support|Billing & Subscription|Bug Report|Feature Request|Business & Partnerships",
  );

  assert(
    "general_support → supportEmail",
    resolveContactRecipient("general_support") === contactConfig.supportEmail,
  );
  assert(
    "billing_subscription → supportEmail",
    resolveContactRecipient("billing_subscription") === contactConfig.supportEmail,
  );
  assert(
    "bug_report → bugEmail",
    resolveContactRecipient("bug_report") === contactConfig.bugEmail,
  );
  assert(
    "feature_request → feedbackEmail",
    resolveContactRecipient("feature_request") === contactConfig.feedbackEmail,
  );
  assert(
    "business_partnerships → partnershipEmail",
    resolveContactRecipient("business_partnerships") === contactConfig.partnershipEmail,
  );

  const valid = validateContactSubmission({
    reason: "bug_report",
    subject: "Broken chart",
    message: "The movement chart fails to load on Safari.",
    name: "Test User",
    email: "test@example.com",
  });
  assert("Valid public payload accepted", valid.ok === true);

  const rejectDestination = validateContactSubmission({
    reason: "bug_report",
    subject: "Broken chart",
    message: "The movement chart fails to load on Safari.",
    name: "Test User",
    email: "test@example.com",
    destinationEmail: "attacker@evil.com",
  });
  assert("Destination injection rejected", rejectDestination.ok === false);

  const rejectReason = validateContactSubmission({
    reason: "not_a_reason",
    subject: "Hello there",
    message: "This is a long enough message.",
    name: "Test User",
    email: "test@example.com",
  });
  assert("Unknown reason rejected", rejectReason.ok === false);

  const honeypot = validateContactSubmission({
    reason: "general_support",
    subject: "Hello there",
    message: "This is a long enough message.",
    name: "Bot",
    email: "bot@example.com",
    website: "http://spam.example",
  });
  assert("Honeypot marked triggered", honeypot.ok === true && honeypot.data.honeypotTriggered === true);

  const trusted = validateContactSubmission(
    {
      reason: "general_support",
      subject: "Account help",
      message: "I need help updating my profile details today.",
      name: "Spoofed",
      email: "spoof@example.com",
    },
    { trustedName: "Trusted User", trustedEmail: "trusted@immifin.com" },
  );
  assert(
    "Trusted identity overrides client name/email",
    trusted.ok === true &&
      trusted.data.name === "Trusted User" &&
      trusted.data.email === "trusted@immifin.com",
  );

  assert("Contact page is public landing path", isPublicLandingPath("/contact"));
  assert(
    "API contact is public middleware pattern",
    PUBLIC_ROUTE_PATTERNS.some((pattern) => String(pattern).includes("/api/contact")),
  );

  const routeSource = readFileSync(resolve("app/api/contact/route.ts"), "utf8");
  assert("API uses resolveContactRecipient", routeSource.includes("resolveContactRecipient"));
  assert("API uses createNotificationService", routeSource.includes("createNotificationService"));
  assert("API sets replyTo to sender email", routeSource.includes("replyTo: validation.data.email"));
  assert("API never reads body.to for routing", !/body\.to\b/.test(routeSource));
  assert("API returns success true only", routeSource.includes('{ success: true }'));
  assert("API accepts multipart form data", routeSource.includes("multipart/form-data"));

  const pageSource = readFileSync(resolve("app/contact/page.tsx"), "utf8");
  assert("Page uses ContactUsForm", pageSource.includes("ContactUsForm"));
  assert("Old mailto channel cards removed", !pageSource.includes("contactChannels"));

  const formSource = readFileSync(resolve("components/contact/ContactUsForm.tsx"), "utf8");
  assert("Form posts to /api/contact", formSource.includes('"/api/contact"'));
  assert("Form includes honeypot website field", formSource.includes('name="website"'));
  assert("Form does not submit destinationEmail", !formSource.includes("destinationEmail"));
  assert("Form submits FormData attachments", formSource.includes("FormData"));
  assert("Form appends attachments", formSource.includes('append("attachments"'));

  const templateSource = readFileSync(
    resolve("emails/templates/contact-request-email.tsx"),
    "utf8",
  );
  assert("Template subject uses IMMIFIN Contact", templateSource.includes("IMMIFIN Contact |"));

  console.log("\nAll S7-UI-012A contact form checks passed.");
}

main();
