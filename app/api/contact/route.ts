export const runtime = "nodejs";

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getEffectivePlan } from "@/lib/account/plan";
import {
  CONTACT_LIMITS,
  type ContactEmailAttachment,
  type ContactSubmissionInput,
  resolveContactRecipient,
  validateContactAttachments,
  validateContactSubmission,
} from "@/lib/contact";
import { createNotificationService, isNotificationError } from "@/lib/notifications";
import { renderContactRequestEmail } from "@/emails/templates/contact-request-email";
import { getProfileWithRelationsByClerkId } from "@/lib/supabase/profiles";
import type { AppPlan } from "@/lib/supabase/types";

function planLabel(plan: AppPlan | null): string | null {
  if (!plan) {
    return null;
  }
  if (plan === "pro") {
    return "Pro";
  }
  if (plan === "power") {
    return "Power";
  }
  return "Free";
}

function environmentLabel(): string {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function sanitizeAttachmentFilename(filename: string): string {
  const base = filename.replace(/[/\\]/g, "").trim() || "attachment";
  return base.slice(0, 180);
}

async function resolveTrustedIdentity(): Promise<{
  isSignedIn: boolean;
  trustedName?: string;
  trustedEmail?: string;
  plan: AppPlan | null;
}> {
  const { userId } = await auth();
  if (!userId) {
    return { isSignedIn: false, plan: null };
  }

  const user = await currentUser();
  if (!user) {
    return { isSignedIn: false, plan: null };
  }

  const primaryEmail =
    user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    return { isSignedIn: false, plan: null };
  }

  const trustedName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.fullName?.trim() ||
    primaryEmail.split("@")[0] ||
    "IMMIFIN user";

  let plan: AppPlan | null = "free";
  try {
    const profileWithRelations = await getProfileWithRelationsByClerkId(userId);
    if (profileWithRelations) {
      plan = getEffectivePlan(profileWithRelations.profile, profileWithRelations.subscription);
    }
  } catch (error) {
    console.error("[contact] failed to load account plan for contact submission");
    void error;
    plan = "free";
  }

  return {
    isSignedIn: true,
    trustedName,
    trustedEmail: primaryEmail.toLowerCase(),
    plan,
  };
}

async function parseJsonBody(request: Request): Promise<
  | { ok: true; input: ContactSubmissionInput; attachments: ContactEmailAttachment[] }
  | { ok: false; response: NextResponse }
> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > CONTACT_LIMITS.maxBodyBytes) {
      return { ok: false, response: jsonError("Request is too large.", 413) };
    }
  }

  try {
    const raw = await request.text();
    if (raw.length > CONTACT_LIMITS.maxBodyBytes) {
      return { ok: false, response: jsonError("Request is too large.", 413) };
    }
    const input = JSON.parse(raw) as ContactSubmissionInput;
    return { ok: true, input, attachments: [] };
  } catch {
    return { ok: false, response: jsonError("Request body must be valid JSON.") };
  }
}

async function parseMultipartBody(request: Request): Promise<
  | { ok: true; input: ContactSubmissionInput; attachments: ContactEmailAttachment[] }
  | { ok: false; response: NextResponse }
> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > CONTACT_LIMITS.maxMultipartBytes) {
      return { ok: false, response: jsonError("Request is too large.", 413) };
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { ok: false, response: jsonError("Request body must be multipart form data.") };
  }

  const input: ContactSubmissionInput = {
    reason: formData.get("reason"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    name: formData.get("name") ?? undefined,
    email: formData.get("email") ?? undefined,
    website: formData.get("website") ?? undefined,
    to: formData.get("to") ?? undefined,
    recipient: formData.get("recipient") ?? undefined,
    destinationEmail: formData.get("destinationEmail") ?? undefined,
  };

  const fileEntries = formData
    .getAll("attachments")
    .filter((entry): entry is File => typeof File !== "undefined" && entry instanceof File);

  const attachments: ContactEmailAttachment[] = [];
  for (const file of fileEntries) {
    if (!file.name || file.size <= 0) {
      continue;
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: sanitizeAttachmentFilename(file.name),
      content: buffer,
      contentType: file.type || undefined,
    });
  }

  return { ok: true, input, attachments };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const isJson = contentType.toLowerCase().includes("application/json");

    if (!isMultipart && !isJson) {
      return jsonError("Request must be JSON or multipart form data.");
    }

    const parsed = isMultipart ? await parseMultipartBody(request) : await parseJsonBody(request);
    if (!parsed.ok) {
      return parsed.response;
    }

    const identity = await resolveTrustedIdentity();
    const validation = validateContactSubmission(parsed.input, {
      trustedName: identity.trustedName,
      trustedEmail: identity.trustedEmail,
    });

    if (!validation.ok) {
      return jsonError(validation.error);
    }

    // Silent success for honeypot traffic — do not tip off bots.
    if (validation.data.honeypotTriggered) {
      return NextResponse.json({ success: true });
    }

    const attachmentCheck = validateContactAttachments(
      validation.data.reason,
      parsed.attachments.map((file) => ({
        name: file.filename,
        size: file.content.byteLength,
        type: file.contentType ?? "",
      })),
    );
    if (!attachmentCheck.ok) {
      return jsonError(attachmentCheck.error);
    }

    const recipient = resolveContactRecipient(validation.data.reason);
    const rendered = await renderContactRequestEmail({
      reason: validation.data.reason,
      subject: validation.data.subject,
      message: validation.data.message,
      senderName: validation.data.name,
      senderEmail: validation.data.email,
      isSignedIn: identity.isSignedIn,
      planLabel: identity.isSignedIn ? planLabel(identity.plan) : null,
      submittedAtIso: new Date().toISOString(),
      environmentLabel: environmentLabel(),
    });

    const notificationService = createNotificationService();
    const result = await notificationService.sendEmail({
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: validation.data.email,
      tags: [
        { name: "category", value: "contact_request" },
        { name: "reason", value: validation.data.reason },
      ],
      attachments: parsed.attachments.length > 0 ? parsed.attachments : undefined,
    });

    if (!result.success) {
      console.error("[contact] notification send failed", {
        reason: validation.data.reason,
        errorCode: result.errorCode,
        attachmentCount: parsed.attachments.length,
      });
      return jsonError("We couldn't send your message right now. Please try again.", 502);
    }

    console.info("[contact] message accepted", {
      reason: validation.data.reason,
      signedIn: identity.isSignedIn,
      attachmentCount: parsed.attachments.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isNotificationError(error)) {
      console.error("[contact] notification error", { code: error.code });
      return jsonError("We couldn't send your message right now. Please try again.", 502);
    }

    console.error("[contact] unexpected error");
    return jsonError("We couldn't send your message right now. Please try again.", 500);
  }
}
