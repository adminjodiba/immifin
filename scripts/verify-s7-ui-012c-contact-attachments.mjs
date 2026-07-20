/**
 * S7-UI-012C — Contact form attachment upload UI + shared validation.
 * Run: npx tsx scripts/verify-s7-ui-012c-contact-attachments.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONTACT_ATTACHMENT_LIMITS,
  attachmentsRequiredForReason,
  validateContactAttachments,
} from "../lib/contact.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  assert("Max 3 files", CONTACT_ATTACHMENT_LIMITS.maxFiles === 3);
  assert("Max 5 MB per file", CONTACT_ATTACHMENT_LIMITS.maxBytesPerFile === 5 * 1024 * 1024);
  assert("Max 10 MB total", CONTACT_ATTACHMENT_LIMITS.maxBytesTotal === 10 * 1024 * 1024);
  assert(
    "Accept attribute lists approved types",
    CONTACT_ATTACHMENT_LIMITS.acceptAttribute === ".png,.jpg,.jpeg,.pdf,.doc,.docx",
  );

  assert("Bug report requires attachments", attachmentsRequiredForReason("bug_report") === true);
  assert(
    "General support attachments optional",
    attachmentsRequiredForReason("general_support") === false,
  );

  assert(
    "Bug report with no files rejected",
    validateContactAttachments("bug_report", []).ok === false,
  );
  assert(
    "General support with no files allowed",
    validateContactAttachments("general_support", []).ok === true,
  );

  const validPng = validateContactAttachments("bug_report", [
    { name: "screen.png", size: 1000, type: "image/png" },
  ]);
  assert("PNG accepted for bug report", validPng.ok === true);

  const tooMany = validateContactAttachments("general_support", [
    { name: "a.png", size: 10, type: "image/png" },
    { name: "b.png", size: 10, type: "image/png" },
    { name: "c.png", size: 10, type: "image/png" },
    { name: "d.png", size: 10, type: "image/png" },
  ]);
  assert("Fourth file rejected", tooMany.ok === false);

  const tooLarge = validateContactAttachments("general_support", [
    { name: "big.pdf", size: 5 * 1024 * 1024 + 1, type: "application/pdf" },
  ]);
  assert("Over 5 MB rejected", tooLarge.ok === false);

  const badType = validateContactAttachments("general_support", [
    { name: "x.exe", size: 10, type: "application/octet-stream" },
  ]);
  assert("Unsupported type rejected", badType.ok === false);

  const formSource = readFileSync(resolve("components/contact/ContactUsForm.tsx"), "utf8");
  assert("Form has Choose Files button", formSource.includes("Choose Files"));
  assert("Form has hidden file input", formSource.includes('type="file"'));
  assert("Form uses multiple files", formSource.includes("multiple"));
  assert("Form appends attachments FormData key", formSource.includes('append("attachments"'));
  assert("Form shows Required/Optional badges", formSource.includes("Required") && formSource.includes("Optional"));
  assert("Form uses paperclip icon component", formSource.includes("PaperclipIcon"));

  const routeSource = readFileSync(resolve("app/api/contact/route.ts"), "utf8");
  assert("API parses multipart form data", routeSource.includes("multipart/form-data"));
  assert("API validates attachments", routeSource.includes("validateContactAttachments"));
  assert("API forwards attachments to notification service", routeSource.includes("attachments:"));

  const providerSource = readFileSync(
    resolve("lib/notifications/providers/resend-provider.ts"),
    "utf8",
  );
  assert("Resend provider sends attachments", providerSource.includes("attachments:"));

  console.log("\nAll S7-UI-012C contact attachment checks passed.");
}

main();
