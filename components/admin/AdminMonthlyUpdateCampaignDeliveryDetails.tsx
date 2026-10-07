"use client";

import { useCallback, useEffect, useState } from "react";

export type DeliveryState =
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "submission_unknown"
  | "skipped_ineligible"
  | "audience_excluded"
  | "eligible_pending"
  | "attempt_in_progress";

export type DeliveryRecipient = {
  campaignRecipientId: string;
  profileId: string;
  originalEligibilityState: "eligible" | "excluded";
  originalTier: string | null;
  currentDeliveryState: DeliveryState;
  attemptCount: number;
  latestAttemptNumber: number | null;
  latestAttemptType: "original" | "recovery" | null;
  latestAttemptOutcome: DeliveryState | null;
  latestAttemptAt: string | null;
  retryable: boolean;
};

export type RecoveryRun = {
  recoveryRunId: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  targetedCount: number;
  providerAcceptedCount: number;
  failedCount: number;
  skippedIneligibleCount: number;
  submissionUnknownCount: number;
};

export type DeliveryDetails = {
  campaignId: string;
  bulletinMonth: string;
  tracked: boolean;
  legacy: boolean;
  originalEligibleCount: number;
  originalExcludedCount: number;
  providerAcceptedCount: number;
  failedBeforeProviderCount: number;
  failedProviderCount: number;
  submissionUnknownCount: number;
  skippedIneligibleCount: number;
  retryableFailedCount: number;
  recipients: DeliveryRecipient[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
  recoveryRuns: RecoveryRun[];
};

type LoadStatus = "idle" | "loading" | "error";

const PAGE_SIZE = 50;

const DELIVERY_STATE_LABELS: Record<DeliveryState, string> = {
  provider_accepted: "Provider Accepted",
  failed_before_provider: "Failed Before Provider",
  failed_provider: "Provider Failed",
  submission_unknown: "Submission Unknown",
  skipped_ineligible: "Skipped — Ineligible",
  audience_excluded: "Audience Excluded",
  eligible_pending: "Pending",
  attempt_in_progress: "Attempt In Progress",
};

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function statusClass(state: DeliveryState): string {
  if (state === "provider_accepted") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (state === "failed_before_provider" || state === "failed_provider") {
    return "bg-red-50 text-red-800 ring-red-200";
  }
  if (state === "submission_unknown" || state === "skipped_ineligible") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function StateBadge({ state }: { state: DeliveryState }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${statusClass(state)}`}>
      {DELIVERY_STATE_LABELS[state]}
    </span>
  );
}

function latestAttemptLabel(recipient: DeliveryRecipient): string {
  if (!recipient.latestAttemptNumber || !recipient.latestAttemptType || !recipient.latestAttemptOutcome) {
    return "No attempts";
  }
  const type = recipient.latestAttemptType === "recovery" ? "Recovery" : "Original";
  return `Attempt #${recipient.latestAttemptNumber} · ${type} · ${DELIVERY_STATE_LABELS[recipient.latestAttemptOutcome]}`;
}

function compactProfileId(profileId: string): string {
  return `Profile …${profileId.slice(-4)}`;
}

export function AdminMonthlyUpdateCampaignDeliveryDetails({ campaignId }: { campaignId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");

  const loadDetails = useCallback(async (requestedPage: number) => {
    setStatus("loading");
    try {
      const response = await fetch(
        `/api/admin/notifications/monthly-immigration-updates/${campaignId}/delivery-details?page=${requestedPage}&pageSize=${PAGE_SIZE}`,
        { method: "GET" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        details?: DeliveryDetails;
        errorMessage?: string;
      };
      if (!response.ok || !payload.success || !payload.details) {
        throw new Error(payload.errorMessage || `Failed to load delivery details (${response.status})`);
      }
      setDetails(payload.details);
      setPage(payload.details.pagination.page);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [campaignId]);

  useEffect(() => {
    setExpanded(false);
    setPage(1);
    setDetails(null);
    setStatus("idle");
  }, [campaignId]);

  useEffect(() => {
    if (expanded) void loadDetails(page);
  }, [expanded, loadDetails, page]);

  const failedCount = (details?.failedBeforeProviderCount ?? 0) + (details?.failedProviderCount ?? 0);
  const pageCount = details?.pagination.totalPages ?? 0;
  const canGoPrevious = page > 1 && status !== "loading";
  const canGoNext = !!details && page < pageCount && status !== "loading";

  return (
    <section className="border-t border-slate-200 pt-4" aria-label="Campaign delivery details">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Delivery Details</h3>
          <p className="mt-1 text-sm text-slate-600">
            Read-only recipient and recovery evidence for this Monthly Immigration Update campaign.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setExpanded((value) => !value)}
          disabled={status === "loading"}
          aria-expanded={expanded}
        >
          {expanded ? "Hide Delivery Details" : "Show Delivery Details"}
        </button>
      </div>

      {!expanded ? null : (
        <div className="mt-4 space-y-4">
          {status === "loading" && !details ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600" role="status">
              Loading delivery details...
            </p>
          ) : null}

          {status === "error" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="status">
              <p className="font-medium">Unable to load delivery details.</p>
              <button type="button" className="mt-2 font-medium underline underline-offset-2" onClick={() => void loadDetails(page)}>
                Try again
              </button>
            </div>
          ) : null}

          {details?.legacy && !details.tracked ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Recipient-level delivery tracking was not available for this campaign.</p>
              <p className="mt-1 text-slate-600">
                Detailed delivery outcomes and automated recovery are available only for campaigns sent after recipient tracking was introduced.
              </p>
            </div>
          ) : null}

          {details?.tracked ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Provider Accepted" value={details.providerAcceptedCount} tone="positive" />
                <Metric label="Failed" value={failedCount} tone="error" />
                <Metric label="Skipped" value={details.skippedIneligibleCount} tone="warning" />
                <Metric label="Submission Unknown" value={details.submissionUnknownCount} tone="warning" />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p><span className="font-semibold text-slate-900">Retryable Failures:</span> {details.retryableFailedCount}</p>
                  <p className="text-slate-600"><span className="font-semibold text-slate-900">Original Audience</span><span className="mx-1.5 text-slate-400" aria-hidden="true">·</span>{details.originalEligibleCount} eligible · {details.originalExcludedCount} excluded</p>
                </div>
                {details.submissionUnknownCount > 0 ? (
                  <p className="mt-2 font-medium text-amber-800">Submission status unknown — manual review required.</p>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-3 font-semibold">Profile</th>
                        <th className="px-3 py-3 font-semibold">Original Eligibility</th>
                        <th className="px-3 py-3 font-semibold">Original Tier</th>
                        <th className="px-3 py-3 font-semibold">Current Delivery State</th>
                        <th className="px-3 py-3 font-semibold">Attempts</th>
                        <th className="px-3 py-3 font-semibold">Latest Attempt</th>
                        <th className="px-3 py-3 font-semibold">Retryable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      {details.recipients.map((recipient) => (
                        <tr key={recipient.campaignRecipientId}>
                          <td className="px-3 py-3 font-mono text-xs text-slate-700" title={recipient.profileId}>{compactProfileId(recipient.profileId)}</td>
                          <td className="px-3 py-3">{recipient.originalEligibilityState === "eligible" ? "Eligible" : "Audience Excluded"}</td>
                          <td className="px-3 py-3">{recipient.originalTier ?? "—"}</td>
                          <td className="px-3 py-3"><StateBadge state={recipient.currentDeliveryState} /></td>
                          <td className="px-3 py-3 tabular-nums">{recipient.attemptCount}</td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {latestAttemptLabel(recipient)}
                            {recipient.latestAttemptAt ? <span className="mt-1 block">{formatTimestamp(recipient.latestAttemptAt)}</span> : null}
                          </td>
                          <td className="px-3 py-3">
                            {recipient.retryable ? (
                              <span className="font-medium text-emerald-800">Yes</span>
                            ) : recipient.currentDeliveryState === "submission_unknown" ? (
                              <span className="font-medium text-amber-800">No — manual review required</span>
                            ) : (
                              <span className="text-slate-600">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {details.recipients.length === 0 ? (
                  <p className="border-t border-slate-100 px-3 py-4 text-sm text-slate-600">No tracked recipient rows are available for this page.</p>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
                <button type="button" className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={!canGoPrevious} onClick={() => setPage((value) => value - 1)}>
                  Previous
                </button>
                <span className="tabular-nums">Page {details.pagination.totalPages === 0 ? 0 : details.pagination.page} of {details.pagination.totalPages}</span>
                <button type="button" className="btn-secondary disabled:cursor-not-allowed disabled:opacity-60" disabled={!canGoNext} onClick={() => setPage((value) => value + 1)}>
                  Next
                </button>
              </div>

              {details.recoveryRuns.length > 0 ? (
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Recovery History</h4>
                    <p className="mt-1 text-sm text-slate-600">Previous failed-recipient recovery attempts for this campaign.</p>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 font-semibold">Requested</th><th className="px-3 py-3 font-semibold">Completed</th><th className="px-3 py-3 font-semibold">Targeted</th><th className="px-3 py-3 font-semibold">Provider Accepted</th><th className="px-3 py-3 font-semibold">Failed</th><th className="px-3 py-3 font-semibold">Skipped</th><th className="px-3 py-3 font-semibold">Submission Unknown</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                          {details.recoveryRuns.map((run) => (
                            <tr key={run.recoveryRunId}>
                              <td className="px-3 py-3 font-medium">{run.status}</td><td className="px-3 py-3">{formatTimestamp(run.requestedAt)}</td><td className="px-3 py-3">{formatTimestamp(run.completedAt)}</td><td className="px-3 py-3 tabular-nums">{run.targetedCount}</td><td className="px-3 py-3 tabular-nums">{run.providerAcceptedCount}</td><td className="px-3 py-3 tabular-nums">{run.failedCount}</td><td className="px-3 py-3 tabular-nums">{run.skippedIneligibleCount}</td><td className="px-3 py-3 tabular-nums">{run.submissionUnknownCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "positive" | "error" | "warning" }) {
  const className = tone === "positive"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : tone === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <div className={`rounded-lg border px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}