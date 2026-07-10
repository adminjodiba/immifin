"use client";

import { FormEvent, useState } from "react";

type PreviewSummary = {
  recipientEmail: string;
  firstName: string;
  journeyType: "employment_gc_waiting" | "green_card_holder";
  updateMonth: string;
  subject: string;
  immigrationCategory: string | null;
  chargeabilityCountry: string | null;
  priorityDate: string | null;
  finalActionStatus: string | null;
  dateForFilingStatus: string | null;
  finalActionMovement: string | null;
  dateForFilingMovement: string | null;
  greenCardIssueDate: string | null;
  earliestFilingDate: string | null;
  daysRemaining: number | null;
  progressPercent: number | null;
  journeyStatus: string | null;
};

type ApiResponse = {
  success?: boolean;
  action?: "preview" | "send";
  preview?: PreviewSummary;
  provider?: string;
  providerMessageId?: string | null;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
};

type Status = "idle" | "loadingPreview" | "loadingSend" | "success" | "error";

export function AdminSendMonthlyImmigrationUpdateForm() {
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const busy = status === "loadingPreview" || status === "loadingSend";

  async function postAction(action: "preview" | "send"): Promise<ApiResponse> {
    const response = await fetch(
      "/api/admin/notifications/send-monthly-immigration-update",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.trim() }),
      }
    );
    const payload = (await response.json().catch(() => ({}))) as ApiResponse;

    if (!response.ok || payload.success === false) {
      const details = [
        payload.errorMessage || payload.message || `Request failed (${response.status})`,
        payload.errorCode ? `Code: ${payload.errorCode}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      throw new Error(details);
    }

    return payload;
  }

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loadingPreview");
    setFeedback(null);
    setPreview(null);

    try {
      const payload = await postAction("preview");
      if (!payload.preview) {
        throw new Error("Preview response did not include a user summary.");
      }
      setPreview(payload.preview);
      setStatus("idle");
      setFeedback("User loaded. Review the summary, then confirm before sending.");
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Failed to load user preview."
      );
    }
  }

  async function handleSend() {
    if (!preview) {
      setStatus("error");
      setFeedback("Load and preview the user before sending.");
      return;
    }

    const confirmed = window.confirm(
      `You are about to send the personalized ${preview.updateMonth} Immigration Update to ${preview.recipientEmail}.\n\nThis action will send one real email.\n\nContinue?`
    );
    if (!confirmed) {
      return;
    }

    setStatus("loadingSend");
    setFeedback(null);

    try {
      const payload = await postAction("send");
      if (payload.preview) {
        setPreview(payload.preview);
      }
      setStatus("success");
      setFeedback(
        [
          payload.message || "Monthly Immigration Update sent.",
          payload.provider ? `Provider: ${payload.provider}` : null,
          payload.providerMessageId
            ? `Message ID: ${payload.providerMessageId}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      );
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to send Monthly Immigration Update."
      );
    }
  }

  return (
    <section className="card-static space-y-4">
      <div>
        <h2 className="heading-2">Send Monthly Update to One User</h2>
        <p className="mt-2 text-sm text-slate-600">
          Admin-only. Loads one existing IMMIFIN user from dashboard data, then
          sends a single personalized Monthly Immigration Update. No bulk send.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handlePreview}>
        <div>
          <label
            htmlFor="monthly-update-user-email"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            User email
          </label>
          <input
            id="monthly-update-user-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setPreview(null);
              setFeedback(null);
              setStatus("idle");
            }}
            className="input-field"
            placeholder="user@example.com"
            disabled={busy}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || !email.trim()}
          >
            {status === "loadingPreview" ? "Loading…" : "Load / Preview User"}
          </button>
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={busy || !preview}
            onClick={handleSend}
          >
            {status === "loadingSend" ? "Sending…" : "Send Monthly Update"}
          </button>
        </div>
      </form>

      {preview ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Preview summary
          </p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Recipient</dt>
              <dd className="font-medium">{preview.recipientEmail}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">First name</dt>
              <dd className="font-medium">{preview.firstName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Journey</dt>
              <dd className="font-medium">
                {preview.journeyType === "green_card_holder"
                  ? "Green Card Holder / Citizenship"
                  : "Employment-Based Green Card Waiting"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Update month</dt>
              <dd className="font-medium">{preview.updateMonth}</dd>
            </div>
            {preview.journeyType === "green_card_holder" ? (
              <>
                <div>
                  <dt className="text-xs text-slate-500">Green Card issue date</dt>
                  <dd className="font-medium">{preview.greenCardIssueDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Earliest N-400 filing</dt>
                  <dd className="font-medium">{preview.earliestFilingDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Days remaining</dt>
                  <dd className="font-medium">{preview.daysRemaining}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Journey status</dt>
                  <dd className="font-medium">{preview.journeyStatus}</dd>
                </div>
                {preview.progressPercent != null ? (
                  <div>
                    <dt className="text-xs text-slate-500">Progress</dt>
                    <dd className="font-medium">{preview.progressPercent}%</dd>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div>
                  <dt className="text-xs text-slate-500">Category</dt>
                  <dd className="font-medium">{preview.immigrationCategory}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Country</dt>
                  <dd className="font-medium">{preview.chargeabilityCountry}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Priority date</dt>
                  <dd className="font-medium">{preview.priorityDate}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Final Action status</dt>
                  <dd className="font-medium">{preview.finalActionStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date for Filing status</dt>
                  <dd className="font-medium">{preview.dateForFilingStatus}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Final Action movement</dt>
                  <dd className="font-medium">{preview.finalActionMovement}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Date for Filing movement</dt>
                  <dd className="font-medium">{preview.dateForFilingMovement}</dd>
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-500">Subject</dt>
              <dd className="font-medium">{preview.subject}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`text-sm leading-relaxed ${
            status === "error" ? "text-red-700" : "text-emerald-800"
          }`}
          role="status"
        >
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
