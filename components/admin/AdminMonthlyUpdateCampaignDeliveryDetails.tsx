"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal } from "@/components/admin/AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal";

export type DeliveryState =
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "submission_unknown"
  | "skipped_ineligible"
  | "audience_excluded"
  | "eligible_pending"
  | "attempt_in_progress";
export type DeliveryStatusFilter =
  | "provider_accepted"
  | "failed"
  | "skipped"
  | "submission_unknown";

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
  hasActiveRecoveryRun: boolean;
  latestRecoveryRunStatus: string | null;
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
type RecoveryStatus = "idle" | "confirming" | "submitting" | "success" | "error" | "conflict" | "ambiguous";

type RecoveryResult = {
  outcome?: "completed" | "idempotent" | "legacy_campaign" | "no_retryable_failures" | "active_recovery_conflict" | "campaign_not_found" | "campaign_not_recoverable";
  providerAcceptedCount?: number;
  failedCount?: number;
  skippedIneligibleCount?: number;
};

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

function retryLabel(retryableFailedCount: number): string {
  return retryableFailedCount === 1
    ? "Retry 1 Failed Recipient"
    : `Retry ${retryableFailedCount} Failed Recipients`;
}

export function AdminMonthlyUpdateCampaignDeliveryDetails({ campaignId }: { campaignId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter | null>(null);
  const [details, setDetails] = useState<DeliveryDetails | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus>("idle");
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryOperationKey, setRecoveryOperationKey] = useState<string | null>(null);

  const loadDetails = useCallback(async (
    requestedPage: number,
    requestedStatusFilter = statusFilter,
  ) => {
    setStatus("loading");
    try {
      const query = new URLSearchParams({
        page: String(requestedPage),
        pageSize: String(PAGE_SIZE),
      });
      if (requestedStatusFilter) query.set("status", requestedStatusFilter);
      const response = await fetch(
        `/api/admin/notifications/monthly-immigration-updates/${campaignId}/delivery-details?${query.toString()}`,
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
  }, [campaignId, statusFilter]);

  useEffect(() => {
    setExpanded(false);
    setPage(1);
    setStatusFilter(null);
    setDetails(null);
    setStatus("idle");
    setRecoveryStatus("idle");
    setRecoveryMessage(null);
    setRecoveryOperationKey(null);
  }, [campaignId]);

  useEffect(() => {
    if (expanded) void loadDetails(page);
  }, [expanded, loadDetails, page]);

  const failedCount = (details?.failedBeforeProviderCount ?? 0) + (details?.failedProviderCount ?? 0);
  const pageCount = details?.pagination.totalPages ?? 0;
  const canGoPrevious = page > 1 && status !== "loading";
  const canGoNext = !!details && page < pageCount && status !== "loading";
  const canRetryFailedRecipients = Boolean(
    details &&
    details.tracked &&
    !details.legacy &&
    details.retryableFailedCount > 0 &&
    !details.hasActiveRecoveryRun,
  );

  const refreshDeliveryDetails = useCallback(async () => {
    await loadDetails(page, statusFilter);
  }, [loadDetails, page, statusFilter]);

  const selectStatusFilter = useCallback((nextFilter: DeliveryStatusFilter | null) => {
    const resolvedFilter = nextFilter === statusFilter ? null : nextFilter;
    setStatusFilter(resolvedFilter);
    setPage(1);
  }, [statusFilter]);

  const submitRecovery = useCallback(async (operationKey: string) => {
    setRecoveryStatus("submitting");
    setRecoveryMessage(null);
    try {
      const response = await fetch(
        `/api/admin/notifications/monthly-immigration-updates/${campaignId}/retry-failed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm: true, idempotencyKey: operationKey }),
        },
      );
      const payload = (await response.json().catch(() => null)) as {
        success?: boolean;
        result?: RecoveryResult;
        errorMessage?: string;
      } | null;
      const responsePayload = payload as {
        success?: boolean;
        result?: RecoveryResult;
        errorMessage?: string;
      } | null;
      if (!responsePayload) {
        setRecoveryStatus("ambiguous");
        setRecoveryMessage("The recovery request outcome could not be confirmed. No new recovery operation will be started automatically. Check Delivery Details, or retry the same request safely.");
        return;
      }

      const result = responsePayload.result;
      if (result?.outcome === "completed") {
        setRecoveryStatus("success");
        setRecoveryMessage(`Recovery completed. Provider Accepted: ${result.providerAcceptedCount ?? 0} · Failed: ${result.failedCount ?? 0} · Skipped: ${result.skippedIneligibleCount ?? 0}.`);
      } else if (result?.outcome === "idempotent") {
        setRecoveryStatus("success");
        setRecoveryMessage("This recovery request was already processed or is recorded for this campaign. Delivery Details have been refreshed.");
      } else if (result?.outcome === "no_retryable_failures") {
        setRecoveryStatus("success");
        setRecoveryMessage("No explicit failed recipients remained when the recovery request was processed. No emails were sent.");
      } else if (result?.outcome === "active_recovery_conflict") {
        setRecoveryStatus("conflict");
        setRecoveryMessage("A failed-recipient recovery is already in progress for this campaign. Delivery Details have been refreshed.");
      } else if (result?.outcome === "legacy_campaign") {
        setRecoveryStatus("error");
        setRecoveryMessage("This campaign does not have recipient-level tracking and cannot be recovered automatically.");
      } else if (result?.outcome === "campaign_not_recoverable") {
        setRecoveryStatus("error");
        setRecoveryMessage("This campaign is not eligible for failed-recipient recovery.");
      } else {
        setRecoveryStatus("error");
        setRecoveryMessage(responsePayload.errorMessage || "Unable to start failed-recipient recovery.");
      }
      setRecoveryOperationKey(null);
      await refreshDeliveryDetails();
    } catch {
      setRecoveryStatus("ambiguous");
      setRecoveryMessage("The recovery request outcome could not be confirmed. No new recovery operation will be started automatically. Check Delivery Details, or retry the same request safely.");
    }
  }, [campaignId, refreshDeliveryDetails]);

  const handleConfirmRecovery = useCallback(() => {
    if (!globalThis.crypto?.randomUUID) {
      setRecoveryStatus("error");
      setRecoveryMessage("Unable to start failed-recipient recovery because this browser cannot create a secure operation key.");
      return;
    }
    const operationKey = `admin-recovery:${globalThis.crypto.randomUUID()}`;
    setRecoveryOperationKey(operationKey);
    void submitRecovery(operationKey);
  }, [submitRecovery]);

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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Filter recipients by latest delivery status">
                <Metric label="Provider Accepted" value={details.providerAcceptedCount} tone="positive" filter="provider_accepted" activeFilter={statusFilter} onSelect={selectStatusFilter} />
                <Metric label="Failed" value={failedCount} tone="error" filter="failed" activeFilter={statusFilter} onSelect={selectStatusFilter} />
                <Metric label="Skipped" value={details.skippedIneligibleCount} tone="warning" filter="skipped" activeFilter={statusFilter} onSelect={selectStatusFilter} />
                <Metric label="Submission Unknown" value={details.submissionUnknownCount} tone="warning" filter="submission_unknown" activeFilter={statusFilter} onSelect={selectStatusFilter} />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <p className="text-slate-600" role="status">
                  {statusFilter
                    ? `Showing ${details.pagination.totalRows} recipient${details.pagination.totalRows === 1 ? "" : "s"} matching ${statusFilter === "failed" ? "Failed" : statusFilter === "skipped" ? "Skipped" : DELIVERY_STATE_LABELS[statusFilter]}.`
                    : "Showing all recipient delivery outcomes."}
                </p>
                {statusFilter ? <button type="button" className="font-medium text-slate-700 underline underline-offset-2" onClick={() => selectStatusFilter(null)}>Show All</button> : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p><span className="font-semibold text-slate-900">Retryable Failures:</span> {details.retryableFailedCount}</p>
                  <p className="text-slate-600"><span className="font-semibold text-slate-900">Original Audience</span><span className="mx-1.5 text-slate-400" aria-hidden="true">·</span>{details.originalEligibleCount} eligible · {details.originalExcludedCount} excluded</p>
                </div>
                {details.submissionUnknownCount > 0 ? (
                  <p className="mt-2 font-medium text-amber-800">Submission status unknown — manual review required.</p>
                ) : null}
                {canRetryFailedRecipients ? (
                  <button
                    type="button"
                    className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => {
                      setRecoveryStatus("confirming");
                      setRecoveryMessage(null);
                    }}
                  >
                    {retryLabel(details.retryableFailedCount)}
                  </button>
                ) : null}
              </div>

              {recoveryStatus !== "idle" && recoveryStatus !== "confirming" && recoveryStatus !== "submitting" && recoveryMessage ? (
                <div className={`rounded-lg border px-4 py-3 text-sm ${recoveryStatus === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : recoveryStatus === "ambiguous" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`} role="status">
                  <p className="font-medium">{recoveryMessage}</p>
                  {recoveryStatus === "ambiguous" ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button type="button" className="btn-secondary" onClick={() => void refreshDeliveryDetails()}>Check Delivery Details</button>
                      <button type="button" className="btn-primary" onClick={() => recoveryOperationKey && void submitRecovery(recoveryOperationKey)} disabled={!recoveryOperationKey}>Retry Same Request</button>
                    </div>
                  ) : null}
                </div>
              ) : null}

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
                      {details.recipients.length === 0 ? (
                        <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-600">No recipients match this delivery status filter.</td></tr>
                      ) : details.recipients.map((recipient) => (
                        <tr key={recipient.campaignRecipientId}>
                                <span className="font-medium text-slate-900">{compactProfileId(recipient.profileId)}</span>
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
      {details ? (
        <AdminMonthlyUpdateFailedRecipientRecoveryConfirmModal
          isOpen={recoveryStatus === "confirming" || recoveryStatus === "submitting"}
          retryableFailedCount={details.retryableFailedCount}
          isSubmitting={recoveryStatus === "submitting"}
          onCancel={() => {
            setRecoveryStatus("idle");
            setRecoveryMessage(null);
          }}
          onConfirm={handleConfirmRecovery}
        />
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
  filter,
  activeFilter,
  onSelect,
}: {
  label: string;
  value: number;
  tone: "positive" | "error" | "warning";
  filter: DeliveryStatusFilter;
  activeFilter: DeliveryStatusFilter | null;
  onSelect: (filter: DeliveryStatusFilter) => void;
}) {
  const className = tone === "positive"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : tone === "error"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-amber-200 bg-amber-50 text-amber-900";
  const isActive = activeFilter === filter;
  return (
    <button
      type="button"
      className={`rounded-lg border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${className} ${isActive ? "ring-2 ring-slate-900 ring-offset-2" : "hover:brightness-95"}`}
      onClick={() => onSelect(filter)}
      aria-pressed={isActive}
      aria-label={`${label}: ${value}. ${isActive ? "Selected; activate to show all recipients." : "Activate to filter recipients."}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </button>
  );
}