/**
 * Centralized contact information and server-side reason routing (S7-UI-012 / S7-UI-012A).
 * Destination addresses must never be accepted from the browser.
 */

export const contactConfig = {
  supportEmail: "support@immifin.com",
  partnershipEmail: "partnerships@immifin.com",
  bugEmail: "bugs@immifin.com",
  feedbackEmail: "feedback@immifin.com",
  officeCity: "Dallas",
  officeState: "Texas",
  officeCountry: "United States",
} as const;

export type ContactConfig = typeof contactConfig;

export const CONTACT_REASONS = [
  "general_support",
  "billing_subscription",
  "bug_report",
  "feature_request",
  "business_partnerships",
] as const;

export type ContactReason = (typeof CONTACT_REASONS)[number];

export type ContactReasonDefinition = {
  id: ContactReason;
  label: string;
  recipientKey: keyof Pick<
    ContactConfig,
    "supportEmail" | "partnershipEmail" | "bugEmail" | "feedbackEmail"
  >;
};

export const CONTACT_REASON_DEFINITIONS: readonly ContactReasonDefinition[] = [
  {
    id: "general_support",
    label: "General Support",
    recipientKey: "supportEmail",
  },
  {
    id: "billing_subscription",
    label: "Billing & Subscription",
    recipientKey: "supportEmail",
  },
  {
    id: "bug_report",
    label: "Bug Report",
    recipientKey: "bugEmail",
  },
  {
    id: "feature_request",
    label: "Feature Request",
    recipientKey: "feedbackEmail",
  },
  {
    id: "business_partnerships",
    label: "Business & Partnerships",
    recipientKey: "partnershipEmail",
  },
] as const;

export function formatOfficeLocation(): string {
  return `${contactConfig.officeCity}, ${contactConfig.officeState}`;
}

export function isContactReason(value: unknown): value is ContactReason {
  return typeof value === "string" && (CONTACT_REASONS as readonly string[]).includes(value);
}

export function getContactReasonDefinition(reason: ContactReason): ContactReasonDefinition {
  const definition = CONTACT_REASON_DEFINITIONS.find((item) => item.id === reason);
  if (!definition) {
    throw new Error(`Unknown contact reason: ${reason}`);
  }
  return definition;
}

/** Server-only: resolve internal recipient from approved reason map. */
export function resolveContactRecipient(reason: ContactReason): string {
  const definition = getContactReasonDefinition(reason);
  return contactConfig[definition.recipientKey];
}

export function getContactReasonLabel(reason: ContactReason): string {
  return getContactReasonDefinition(reason).label;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const CONTACT_LIMITS = {
  subjectMin: 3,
  subjectMax: 150,
  messageMin: 10,
  messageMax: 5000,
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  /** Approximate max JSON body size for public contact posts without files. */
  maxBodyBytes: 20_000,
  /** Multipart request ceiling covering 10 MB attachments + form fields. */
  maxMultipartBytes: 12 * 1024 * 1024,
} as const;

export const CONTACT_ATTACHMENT_LIMITS = {
  maxFiles: 3,
  maxBytesPerFile: 5 * 1024 * 1024,
  maxBytesTotal: 10 * 1024 * 1024,
  acceptAttribute: ".png,.jpg,.jpeg,.pdf,.doc,.docx",
  extensions: [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx"] as const,
  mimeTypes: [
    "image/png",
    "image/jpeg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as const,
} as const;

export type ContactAttachmentMeta = {
  name: string;
  size: number;
  type: string;
};

export type ContactEmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export function attachmentsRequiredForReason(reason: ContactReason | ""): boolean {
  return reason === "bug_report";
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const index = trimmed.lastIndexOf(".");
  if (index < 0) {
    return "";
  }
  return trimmed.slice(index);
}

function isAllowedAttachmentType(filename: string, mimeType: string): boolean {
  const extension = getFileExtension(filename);
  const extensionAllowed = (CONTACT_ATTACHMENT_LIMITS.extensions as readonly string[]).includes(
    extension,
  );
  if (!extensionAllowed) {
    return false;
  }

  const normalizedMime = mimeType.trim().toLowerCase();
  // Some browsers send empty MIME for .doc/.docx — allow when extension is approved.
  if (!normalizedMime) {
    return true;
  }

  return (CONTACT_ATTACHMENT_LIMITS.mimeTypes as readonly string[]).includes(normalizedMime);
}

export type AttachmentValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateContactAttachments(
  reason: ContactReason | "",
  files: readonly ContactAttachmentMeta[],
): AttachmentValidationResult {
  if (attachmentsRequiredForReason(reason) && files.length === 0) {
    return { ok: false, error: "Bug Reports require at least one attachment." };
  }

  if (files.length > CONTACT_ATTACHMENT_LIMITS.maxFiles) {
    return { ok: false, error: "You can attach up to 3 files." };
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!file.name?.trim()) {
      return { ok: false, error: "This file type is not supported." };
    }
    if (!isAllowedAttachmentType(file.name, file.type ?? "")) {
      return { ok: false, error: "This file type is not supported." };
    }
    if (file.size <= 0 || file.size > CONTACT_ATTACHMENT_LIMITS.maxBytesPerFile) {
      return { ok: false, error: "Each file must be 5 MB or smaller." };
    }
    totalBytes += file.size;
  }

  if (totalBytes > CONTACT_ATTACHMENT_LIMITS.maxBytesTotal) {
    return { ok: false, error: "The combined attachment size must not exceed 10 MB." };
  }

  return { ok: true };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactSubmissionInput = {
  reason: unknown;
  subject: unknown;
  message: unknown;
  name?: unknown;
  email?: unknown;
  /** Honeypot — must be empty when present. */
  website?: unknown;
  to?: unknown;
  recipient?: unknown;
  destinationEmail?: unknown;
};

export type ValidatedContactSubmission = {
  reason: ContactReason;
  subject: string;
  message: string;
  name: string;
  email: string;
  honeypotTriggered: boolean;
};

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export type ContactValidationResult =
  | { ok: true; data: ValidatedContactSubmission }
  | { ok: false; error: string };

/**
 * Validate public/authenticated contact payload.
 * Authenticated callers should pass trusted name/email overrides after identity resolution.
 */
export function validateContactSubmission(
  input: ContactSubmissionInput,
  options?: { trustedName?: string; trustedEmail?: string },
): ContactValidationResult {
  if (
    input.to !== undefined ||
    input.recipient !== undefined ||
    input.destinationEmail !== undefined
  ) {
    return { ok: false, error: "Invalid request." };
  }

  const honeypot =
    typeof input.website === "string" ? input.website.trim() : "";
  if (honeypot.length > 0) {
    return {
      ok: true,
      data: {
        reason: "general_support",
        subject: "honeypot",
        message: "honeypot",
        name: "honeypot",
        email: "honeypot@invalid.local",
        honeypotTriggered: true,
      },
    };
  }

  if (!isContactReason(input.reason)) {
    return { ok: false, error: "Select a valid contact reason." };
  }

  const subject = asTrimmedString(input.subject);
  if (!subject || subject.length < CONTACT_LIMITS.subjectMin) {
    return { ok: false, error: "Enter a subject of at least 3 characters." };
  }
  if (subject.length > CONTACT_LIMITS.subjectMax) {
    return { ok: false, error: "Subject must be 150 characters or fewer." };
  }

  const message = asTrimmedString(input.message);
  if (!message || message.length < CONTACT_LIMITS.messageMin) {
    return { ok: false, error: "Enter a message of at least 10 characters." };
  }
  if (message.length > CONTACT_LIMITS.messageMax) {
    return { ok: false, error: "Message must be 5,000 characters or fewer." };
  }

  const name = (options?.trustedName ?? asTrimmedString(input.name) ?? "").trim();
  if (name.length < CONTACT_LIMITS.nameMin) {
    return { ok: false, error: "Enter your name." };
  }
  if (name.length > CONTACT_LIMITS.nameMax) {
    return { ok: false, error: "Name must be 100 characters or fewer." };
  }

  const emailRaw = (options?.trustedEmail ?? asTrimmedString(input.email) ?? "")
    .trim()
    .toLowerCase();
  if (!emailRaw || emailRaw.length > CONTACT_LIMITS.emailMax || !EMAIL_PATTERN.test(emailRaw)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  return {
    ok: true,
    data: {
      reason: input.reason,
      subject,
      message,
      name,
      email: emailRaw,
      honeypotTriggered: false,
    },
  };
}
