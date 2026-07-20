"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  CONTACT_ATTACHMENT_LIMITS,
  CONTACT_LIMITS,
  CONTACT_REASON_DEFINITIONS,
  type ContactReason,
  attachmentsRequiredForReason,
  contactConfig,
  formatAttachmentSize,
  formatOfficeLocation,
  validateContactAttachments,
} from "@/lib/contact";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";

type FormState = {
  reason: ContactReason | "";
  subject: string;
  message: string;
  name: string;
  email: string;
  website: string;
};

const INITIAL_STATE: FormState = {
  reason: "",
  subject: "",
  message: "",
  name: "",
  email: "",
  website: "",
};

const inputClassName =
  "mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15";

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 8.25l-10.94 10.94a1.5 1.5 0 0 1-2.121-2.121l7.773-7.772"
      />
    </svg>
  );
}

export function ContactUsForm() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [files, setFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const attachmentStatusId = useId();
  const attachmentHelpId = useId();
  const attachmentErrorId = useId();

  useEffect(() => {
    if (!userLoaded || !isSignedIn || !user) {
      return;
    }

    const trustedName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.fullName?.trim() ||
      "";
    const trustedEmail =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      "";

    setForm((current) => ({
      ...current,
      name: trustedName || current.name,
      email: trustedEmail || current.email,
    }));
  }, [userLoaded, isSignedIn, user]);

  const inCooldown = Date.now() < cooldownUntil;
  const ready = authLoaded && userLoaded;
  const attachmentsRequired = attachmentsRequiredForReason(form.reason);

  function mergeSelectedFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) {
      return;
    }

    const next = [...files];
    for (const file of Array.from(incoming)) {
      const duplicate = next.some(
        (existing) =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified,
      );
      if (!duplicate) {
        next.push(file);
      }
    }

    // Validate limits/types without enforcing Bug Report required while selecting files.
    const limitsOnly = validateContactAttachments(
      "general_support",
      next.map((file) => ({ name: file.name, size: file.size, type: file.type })),
    );

    if (!limitsOnly.ok) {
      setAttachmentError(limitsOnly.error);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setAttachmentError(null);
    setFiles(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setAttachmentError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || inCooldown) {
      return;
    }

    setError(null);
    setAttachmentError(null);

    const attachmentValidation = validateContactAttachments(
      form.reason,
      files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
    );
    if (!attachmentValidation.ok) {
      setAttachmentError(attachmentValidation.error);
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.set("reason", form.reason);
      payload.set("subject", form.subject);
      payload.set("message", form.message);
      payload.set("website", form.website);
      if (!isSignedIn) {
        payload.set("name", form.name);
        payload.set("email", form.email);
      }
      for (const file of files) {
        payload.append("attachments", file, file.name);
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        body: payload,
      });

      const result = await readJsonResponseBody<{ success?: boolean; error?: string }>(response);

      if (!result.ok || result.data.success !== true) {
        const message =
          (!result.ok ? result.error : result.data.error) ||
          "We couldn't send your message right now. Please try again.";
        setError(message);
        return;
      }

      setSuccess(true);
      setCooldownUntil(Date.now() + 8_000);
      setFiles([]);
      setForm((current) => ({
        ...INITIAL_STATE,
        name: isSignedIn ? current.name : "",
        email: isSignedIn ? current.email : "",
      }));
    } catch {
      setError("We couldn't send your message right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="card-static" role="status" aria-live="polite">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Message sent</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Thank you for contacting IMMIFIN. Your message has been routed to the appropriate team.
        </p>
        <dl className="mt-5 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-800">Free</dt>
            <dd className="text-slate-600">Within 5 business days</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-800">Pro</dt>
            <dd className="text-slate-600">Priority support</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-800">Power</dt>
            <dd className="text-slate-600">Priority support</dd>
          </div>
        </dl>
        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={() => {
            setSuccess(false);
            setError(null);
            setAttachmentError(null);
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="relative card-static space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="contact-reason" className="block text-sm font-semibold text-slate-900">
          Contact Reason
        </label>
        <select
          id="contact-reason"
          name="reason"
          required
          className={inputClassName}
          value={form.reason}
          disabled={!ready || submitting}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              reason: event.target.value as ContactReason | "",
            }))
          }
        >
          <option value="" disabled>
            Select a reason
          </option>
          {CONTACT_REASON_DEFINITIONS.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-subject" className="block text-sm font-semibold text-slate-900">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          required
          maxLength={CONTACT_LIMITS.subjectMax}
          className={inputClassName}
          value={form.subject}
          disabled={!ready || submitting}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-semibold text-slate-900">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={7}
          maxLength={CONTACT_LIMITS.messageMax}
          className={`${inputClassName} resize-y`}
          value={form.message}
          disabled={!ready || submitting}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900" id={attachmentStatusId}>
            Attachments
          </p>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${
              attachmentsRequired
                ? "bg-amber-100 text-amber-900 ring-1 ring-amber-200"
                : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
            }`}
          >
            {attachmentsRequired ? "Required" : "Optional"}
          </span>
        </div>
        <p id={attachmentHelpId} className="mt-1 text-sm text-slate-600">
          {attachmentsRequired
            ? "Please attach at least one screenshot or supporting document so we can understand and reproduce the issue."
            : "Attach screenshots or supporting documents if they help explain your request."}
        </p>

        <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <div className="flex items-start gap-3">
            <PaperclipIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Attach supporting files</p>
              <label
                htmlFor={fileInputId}
                className={`btn-secondary mt-3 inline-flex cursor-pointer px-4 py-2 text-sm ${
                  !ready || submitting ? "pointer-events-none opacity-60" : ""
                }`}
              >
                Choose Files
              </label>
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                multiple
                accept={CONTACT_ATTACHMENT_LIMITS.acceptAttribute}
                className="sr-only"
                disabled={!ready || submitting}
                onChange={(event) => mergeSelectedFiles(event.target.files)}
                aria-labelledby={attachmentStatusId}
                aria-describedby={`${attachmentHelpId}${attachmentError ? ` ${attachmentErrorId}` : ""}`}
                aria-required={attachmentsRequired}
                aria-invalid={Boolean(attachmentError)}
              />
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                PNG, JPG, JPEG, PDF, DOC, DOCX
                <br />
                Maximum 3 files • 5 MB each • 10 MB total
              </p>
            </div>
          </div>
        </div>

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2" aria-label="Selected attachments">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
              >
                <PaperclipIcon className="h-4 w-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatAttachmentSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {attachmentError ? (
          <p
            id={attachmentErrorId}
            className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {attachmentError}
          </p>
        ) : null}
      </div>

      {isSignedIn ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Response will be sent to
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{form.email || "Your account email"}</p>
          {form.name ? <p className="mt-1 text-sm text-slate-600">{form.name}</p> : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-semibold text-slate-900">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              maxLength={CONTACT_LIMITS.nameMax}
              className={inputClassName}
              value={form.name}
              disabled={!ready || submitting}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-semibold text-slate-900">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              maxLength={CONTACT_LIMITS.emailMax}
              className={inputClassName}
              value={form.email}
              disabled={!ready || submitting}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Honeypot — visually hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Company website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
        />
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!ready || submitting || inCooldown}>
        {submitting ? "Sending…" : "Send Message"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Free: response within 5 business days. Pro and Power: priority support.
      </p>
    </form>
  );
}

export function ContactOfficeCard() {
  return (
    <section className="card-static text-center sm:text-left">
      <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Office</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {formatOfficeLocation()}
        <br />
        {contactConfig.officeCountry}
      </p>
    </section>
  );
}
