"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminMonthlyUpdateConfirmModal } from "@/components/admin/AdminMonthlyUpdateConfirmModal";

type ExclusionBreakdown = {
  freePlan: number;
  missingImmigrationProfile: number;
  missingRequiredData: number;
  notificationOptOut: number;
  invalidEmail: number;
  unsupportedProfile: number;
};

type AudienceSummary = {
  bulletinMonthKey: string | null;
  bulletinMonthLabel: string | null;
  bulletinRefreshedAt: string | null;
  activeUserCount: number;
  proCount: number;
  powerCount: number;
  totalRecipients: number;
  skippedCount: number;
  exclusionBreakdown: ExclusionBreakdown;
  lastSentAt: string | null;
  lastSentBulletinMonth: string | null;
  controlStatus: string;
  campaignStatus: string | null;
  canSend: boolean;
  sendBlockedReason: string | null;
  provider: string;
};

type BulkSendResult = {
  controlStatus: string;
  bulletinMonthKey: string;
  bulletinMonthLabel: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  proCount: number;
  powerCount: number;
  completedAt: string | null;
  provider: string;
  campaignId: string;
};

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
  greenCardIssueDate: string | null;
  earliestFilingDate: string | null;
  daysRemaining: number | null;
  journeyStatus: string | null;
};

type Status = "idle" | "loading" | "sending" | "success" | "error";

const EMPTY_BREAKDOWN: ExclusionBreakdown = {
  freePlan: 0,
  missingImmigrationProfile: 0,
  missingRequiredData: 0,
  notificationOptOut: 0,
  invalidEmail: 0,
  unsupportedProfile: 0,
};

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Never";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ExclusionRow({
  label,
  count,
  emphasize,
}: {
  label: string;
  count: number;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/70 py-1.5 last:border-b-0">
      <span className="text-slate-600">• {label}</span>
      <span
        className={`font-semibold tabular-nums ${
          emphasize && count > 0 ? "text-amber-700" : "text-slate-500"
        }`}
      >
        {count}
      </span>
    </div>
  );
}

export function AdminMonthlyUpdateControlCenter() {
  const [summary, setSummary] = useState<AudienceSummary | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<BulkSendResult | null>(null);
  const [previewEmail, setPreviewEmail] = useState("");
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [previewStatus, setPreviewStatus] = useState<Status>("idle");
  const [previewFeedback, setPreviewFeedback] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    setStatus("loading");
    setFeedback(null);
    try {
      const response = await fetch(
        "/api/admin/notifications/monthly-immigration-updates/summary",
        { method: "GET" }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        summary?: AudienceSummary;
        errorMessage?: string;
      };
      if (!response.ok || !payload.success || !payload.summary) {
        throw new Error(
          payload.errorMessage || `Failed to load summary (${response.status})`
        );
      }
      setSummary(payload.summary);
      setStatus("idle");
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Failed to load audience summary."
      );
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  async function handlePreviewSample(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreviewStatus("loading");
    setPreviewFeedback(null);
    setPreview(null);

    try {
      const response = await fetch(
        "/api/admin/notifications/send-monthly-immigration-update",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "preview",
            email: previewEmail.trim(),
          }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        preview?: PreviewSummary;
        errorMessage?: string;
        errorCode?: string;
      };
      if (!response.ok || !payload.success || !payload.preview) {
        throw new Error(
          [
            payload.errorMessage || `Preview failed (${response.status})`,
            payload.errorCode ? `Code: ${payload.errorCode}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        );
      }
      setPreview(payload.preview);
      setPreviewStatus("success");
      setPreviewFeedback("Sample preview loaded. No email was sent.");
    } catch (error: unknown) {
      setPreviewStatus("error");
      setPreviewFeedback(
        error instanceof Error ? error.message : "Failed to preview sample."
      );
    }
  }

  function openConfirmModal() {
    if (!summary || status === "sending") {
      return;
    }
    setFeedback(null);
    setConfirmOpen(true);
  }

  function handleCancelConfirm() {
    if (status === "sending") {
      return;
    }
    setConfirmOpen(false);
    setFeedback("Send cancelled. No emails were sent.");
    setStatus("idle");
  }

  async function handleConfirmSend() {
    if (!summary || status === "sending") {
      return;
    }

    setStatus("sending");
    setFeedback(null);
    setSendResult(null);

    try {
      const response = await fetch(
        "/api/admin/notifications/monthly-immigration-updates/send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true }),
        }
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        result?: BulkSendResult;
        message?: string;
        errorMessage?: string;
      };
      if (!response.ok || !payload.success || !payload.result) {
        throw new Error(
          payload.errorMessage || payload.message || `Send failed (${response.status})`
        );
      }

      setConfirmOpen(false);
      setSendResult(payload.result);
      setStatus("success");
      setFeedback(payload.message || "Monthly Update Complete");
      await loadSummary();
    } catch (error: unknown) {
      setConfirmOpen(false);
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to send Monthly Immigration Updates."
      );
      await loadSummary();
    }
  }

  const busy = status === "loading" || status === "sending";
  const sendDisabled =
    busy || !summary?.canSend || summary.totalRecipients <= 0;

  const breakdown = summary?.exclusionBreakdown ?? EMPTY_BREAKDOWN;
  const excludedTotal = summary?.skippedCount ?? 0;
  const eligibleTotal = summary?.totalRecipients ?? 0;
  const activeTotal = summary?.activeUserCount ?? 0;
  const totalsMatch = activeTotal === eligibleTotal + excludedTotal;
  const needsAttention = excludedTotal > 0 && eligibleTotal === 0;

  return (
    <section className="card-static space-y-5">
      <div>
        <h2 className="heading-2">Monthly Immigration Updates</h2>
        <p className="mt-2 text-sm text-slate-600">
          Admin Control Center for the current Visa Bulletin Monthly Immigration
          Update. Sends only to eligible Pro and Power subscribers.
        </p>
      </div>

      {summary ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-800">
          <p className="text-base font-semibold text-slate-900">
            {summary.bulletinMonthLabel
              ? `${summary.bulletinMonthLabel} Visa Bulletin`
              : "Visa Bulletin unavailable"}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Last sent
              </dt>
              <dd className="mt-1 font-medium">
                {formatTimestamp(summary.lastSentAt)}
                {summary.lastSentBulletinMonth
                  ? ` (${summary.lastSentBulletinMonth})`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Bulletin refreshed
              </dt>
              <dd className="mt-1 font-medium">
                {formatTimestamp(summary.bulletinRefreshedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Current status
              </dt>
              <dd className="mt-1 font-semibold text-brand-800">
                {summary.controlStatus}
              </dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-emerald-200/80 bg-white/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                Eligible Recipients
              </p>
              <div className="mt-2 space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-emerald-900">✓ Pro Subscribers</span>
                  <span className="font-semibold tabular-nums text-emerald-800">
                    {summary.proCount}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-emerald-900">✓ Power Subscribers</span>
                  <span className="font-semibold tabular-nums text-emerald-800">
                    {summary.powerCount}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-emerald-100 pt-2">
                  <span className="font-medium text-emerald-950">Total</span>
                  <span className="font-semibold tabular-nums text-emerald-900">
                    {summary.totalRecipients}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`rounded-lg border bg-white/80 px-4 py-3 ${
                needsAttention ? "border-amber-300" : "border-slate-200"
              }`}
            >
              <p
                className={`text-xs font-semibold uppercase tracking-wide ${
                  needsAttention ? "text-amber-800" : "text-slate-500"
                }`}
              >
                Excluded Users
              </p>
              <div className="mt-2 text-sm">
                <ExclusionRow label="Free Plan" count={breakdown.freePlan} />
                <ExclusionRow
                  label="Missing Immigration Profile"
                  count={breakdown.missingImmigrationProfile}
                />
                <ExclusionRow
                  label="Missing Required Data"
                  count={breakdown.missingRequiredData}
                />
                <ExclusionRow
                  label="Notification Opt-out"
                  count={breakdown.notificationOptOut}
                />
                <ExclusionRow label="Invalid Email" count={breakdown.invalidEmail} />
                <ExclusionRow
                  label="Unsupported Profile"
                  count={breakdown.unsupportedProfile}
                  emphasize={needsAttention}
                />
                <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2">
                  <span className="font-medium text-slate-700">Total excluded</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      needsAttention ? "text-amber-700" : "text-slate-600"
                    }`}
                  >
                    {excludedTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Active users: {activeTotal} = Eligible {eligibleTotal} + Excluded{" "}
            {excludedTotal}
            {totalsMatch ? "" : " (totals do not reconcile — refresh and recheck)"}
          </p>

          {summary.sendBlockedReason ? (
            <p className="mt-3 text-sm text-amber-800">{summary.sendBlockedReason}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => void loadSummary()}
        >
          {status === "loading" ? "Refreshing…" : "Refresh Summary"}
        </button>
        <button
          type="button"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={sendDisabled}
          onClick={openConfirmModal}
        >
          {status === "sending" ? "Sending…" : "Send Monthly Updates"}
        </button>
      </div>

      <form className="space-y-3 border-t border-slate-200 pt-4" onSubmit={handlePreviewSample}>
        <h3 className="text-sm font-semibold text-slate-900">Preview Sample</h3>
        <p className="text-sm text-slate-600">
          Uses the existing single-user preview flow. Does not mass-send.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="monthly-update-preview-email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Existing user email
            </label>
            <input
              id="monthly-update-preview-email"
              type="email"
              required
              value={previewEmail}
              onChange={(event) => setPreviewEmail(event.target.value)}
              className="input-field"
              placeholder="user@example.com"
              disabled={previewStatus === "loading" || busy}
            />
          </div>
          <button
            type="submit"
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={previewStatus === "loading" || busy || !previewEmail.trim()}
          >
            {previewStatus === "loading" ? "Loading…" : "Preview Sample"}
          </button>
        </div>
        {preview ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <p className="font-medium text-slate-900">{preview.subject}</p>
            {preview.journeyType === "green_card_holder" ? (
              <>
                <p className="mt-2 text-slate-700">
                  {preview.firstName} · Green Card Holder · Issue Date{" "}
                  {preview.greenCardIssueDate}
                </p>
                <p className="mt-1 text-slate-600">
                  N-400: {preview.earliestFilingDate} ·{" "}
                  {preview.daysRemaining ?? 0} days remaining ·{" "}
                  {preview.journeyStatus}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-slate-700">
                  {preview.firstName} · {preview.immigrationCategory} ·{" "}
                  {preview.chargeabilityCountry} · {preview.priorityDate}
                </p>
                <p className="mt-1 text-slate-600">
                  FA: {preview.finalActionStatus} · DFF:{" "}
                  {preview.dateForFilingStatus}
                </p>
              </>
            )}
          </div>
        ) : null}
        {previewFeedback ? (
          <p
            className={`text-sm ${
              previewStatus === "error" ? "text-red-700" : "text-emerald-800"
            }`}
            role="status"
          >
            {previewFeedback}
          </p>
        ) : null}
      </form>

      {sendResult ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
          <p className="font-semibold">
            {sendResult.failureCount > 0
              ? "Completed with Failures"
              : "Monthly Update Complete"}
          </p>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            <li>Total recipients: {sendResult.totalRecipients}</li>
            <li>Sent successfully: {sendResult.successCount}</li>
            <li>Failed: {sendResult.failureCount}</li>
            <li>Skipped: {sendResult.skippedCount}</li>
            <li>Pro recipients: {sendResult.proCount}</li>
            <li>Power recipients: {sendResult.powerCount}</li>
            <li>Completed: {formatTimestamp(sendResult.completedAt)}</li>
            <li>Provider: {sendResult.provider}</li>
          </ul>
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

      {summary ? (
        <AdminMonthlyUpdateConfirmModal
          isOpen={confirmOpen}
          bulletinMonthLabel={summary.bulletinMonthLabel ?? "current"}
          totalRecipients={summary.totalRecipients}
          proCount={summary.proCount}
          powerCount={summary.powerCount}
          isSubmitting={status === "sending"}
          onCancel={handleCancelConfirm}
          onConfirm={() => void handleConfirmSend()}
        />
      ) : null}
    </section>
  );
}
