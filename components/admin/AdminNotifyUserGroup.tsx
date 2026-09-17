"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { AdminMonthlyUpdateConfirmModal } from "@/components/admin/AdminMonthlyUpdateConfirmModal";
import {
  displayAdminNotifyValue,
  formatAdminNotifyBulletinMonth,
  formatAdminNotifyTimestamp,
  type MonthlyUpdateAudienceSummary,
  type MonthlyUpdateBulkSendResult,
  type MonthlyUpdatePreviewSummary,
} from "@/components/admin/admin-notifications-ui";

type Status = "idle" | "loading" | "sending" | "success" | "error";
type WorkflowStage = "review" | "generate" | "preview";

const WORKFLOW_STEPS = [
  {
    id: 1,
    title: "Review Audience",
    copy: "Check eligible members and bulletin details",
  },
  {
    id: 2,
    title: "Generate Update",
    copy: "Create personalized content for all members",
  },
  {
    id: 3,
    title: "Preview",
    copy: "Review the email content before sending",
  },
  {
    id: 4,
    title: "Confirm & Send",
    copy: "Send to all eligible members",
  },
] as const;

function campaignStatusClass(status: string | undefined): string {
  if (status === "Already Sent" || status === "Completed") {
    return "ds2-admin-notify-status ds2-admin-notify-status-ready";
  }
  if (status === "Ready to Send" || status === "Not Ready") {
    return "ds2-admin-notify-status ds2-admin-notify-status-unsent";
  }
  if (status === "Completed with Failures" || status === "Sending") {
    return "ds2-admin-notify-status ds2-admin-notify-status-warning";
  }
  return "ds2-admin-notify-status ds2-admin-notify-status-blocked";
}

function isUnsentCampaignStatus(status: string | undefined): boolean {
  return status === "Ready to Send" || status === "Not Ready";
}

function isCompletedCampaignStatus(status: string | undefined): boolean {
  return (
    status === "Already Sent" ||
    status === "Completed" ||
    status === "Completed with Failures"
  );
}

function currentWorkflowStep(input: {
  summary: MonthlyUpdateAudienceSummary | null;
  workflowStage: WorkflowStage;
  hasSamplePreview: boolean;
  confirmOpen: boolean;
}): number {
  if (isCompletedCampaignStatus(input.summary?.controlStatus)) {
    return 4;
  }
  if (input.confirmOpen) {
    return 4;
  }
  if (input.hasSamplePreview || input.workflowStage === "preview") {
    return 3;
  }
  if (input.workflowStage === "generate") {
    return 2;
  }
  return 1;
}

function journeyLabel(preview: MonthlyUpdatePreviewSummary): string {
  return preview.journeyType === "green_card_holder"
    ? "Green Card Holder / Citizenship"
    : "Employment-Based Green Card Waiting";
}

export function AdminNotifyUserGroup({
  sendLockedReason = null,
}: {
  sendLockedReason?: string | null;
}) {
  const [summary, setSummary] = useState<MonthlyUpdateAudienceSummary | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<MonthlyUpdateBulkSendResult | null>(null);
  const [previewEmail, setPreviewEmail] = useState("");
  const [preview, setPreview] = useState<MonthlyUpdatePreviewSummary | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<Status>("idle");
  const [previewFeedback, setPreviewFeedback] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("review");

  const loadSummary = useCallback(async () => {
    setStatus("loading");
    setFeedback(null);
    try {
      const response = await fetch(
        "/api/admin/notifications/monthly-immigration-updates/summary",
        { method: "GET" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        summary?: MonthlyUpdateAudienceSummary;
        errorMessage?: string;
      };
      if (!response.ok || !payload.success || !payload.summary) {
        throw new Error(
          payload.errorMessage || `Failed to load summary (${response.status})`,
        );
      }
      setSummary(payload.summary);
      setStatus("idle");
      return payload.summary;
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Failed to load audience summary.",
      );
      return null;
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
    setPreviewHtml(null);

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
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        preview?: MonthlyUpdatePreviewSummary;
        html?: string;
        text?: string;
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
            .join(" · "),
        );
      }
      setPreview(payload.preview);
      setPreviewHtml(typeof payload.html === "string" ? payload.html : null);
      setPreviewStatus("success");
      setWorkflowStage("preview");
      setPreviewFeedback("Preview generated. No email was sent.");
    } catch (error: unknown) {
      setPreviewStatus("error");
      setPreviewFeedback(
        error instanceof Error ? error.message : "Failed to preview sample.",
      );
    }
  }

  async function handleGenerateMonthlyUpdate() {
    if (status === "sending") {
      return;
    }
    const next = await loadSummary();
    if (!next?.canSend) {
      setWorkflowStage("review");
      return;
    }
    setFeedback(null);
    setWorkflowStage("generate");
  }

  function backToReview() {
    if (status === "sending") {
      return;
    }
    setConfirmOpen(false);
    setWorkflowStage("review");
  }

  function openConfirmModal() {
    if (!summary || status === "sending" || !summary.canSend || sendLockedReason) {
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
    if (!summary || status === "sending" || sendLockedReason) {
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
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        result?: MonthlyUpdateBulkSendResult;
        message?: string;
        errorMessage?: string;
      };
      if (!response.ok || !payload.success || !payload.result) {
        throw new Error(
          payload.errorMessage || payload.message || `Send failed (${response.status})`,
        );
      }

      setConfirmOpen(false);
      setSendResult(payload.result);
      setStatus("success");
      setWorkflowStage("review");
      setFeedback(payload.message || "Monthly Update Complete");
      await loadSummary();
    } catch (error: unknown) {
      setConfirmOpen(false);
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to send Monthly Immigration Updates.",
      );
      await loadSummary();
    }
  }

  const busy = status === "loading" || status === "sending";
  const campaignComplete = isCompletedCampaignStatus(summary?.controlStatus);
  const canStartBulkWorkflow = Boolean(summary?.canSend);
  const sendDisabled = busy || !canStartBulkWorkflow || !preview;
  const showBulkWorkflow = canStartBulkWorkflow && workflowStage !== "review";
  const activeStep = currentWorkflowStep({
    summary,
    workflowStage,
    hasSamplePreview: Boolean(preview),
    confirmOpen,
  });
  const currentCampaignLabel = summary?.currentCampaignSentAt
    ? formatAdminNotifyTimestamp(summary.currentCampaignSentAt)
    : summary
      ? "Not Sent"
      : "—";
  const previousBulletinLabel = summary?.previousCampaignBulletinMonth
    ? formatAdminNotifyBulletinMonth(summary.previousCampaignBulletinMonth)
    : "—";
  const previousCampaignSentLabel = summary?.previousCampaignSentAt
    ? formatAdminNotifyTimestamp(summary.previousCampaignSentAt)
    : summary
      ? "No campaign yet"
      : "—";

  return (
    <section className="ds2-admin-notify-card" aria-labelledby="notify-user-group-heading">
      <div className="ds2-admin-notify-card-head">
        <span className="ds2-admin-notify-card-icon ds2-admin-notify-card-icon-bulk" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="8" r="3" />
            <circle cx="16" cy="9" r="2.4" />
            <path d="M4.5 18c.6-2.6 2.7-4 4.5-4s3.9 1.4 4.5 4" />
            <path d="M13.2 18c.3-1.8 1.5-3 3-3s2.4.9 2.8 2.4" />
          </svg>
        </span>
        <div>
          <div className="ds2-admin-notify-card-heading">
            <h2 id="notify-user-group-heading" className="ds2-admin-notify-card-title">
              Notify User Group
            </h2>
            <span className="ds2-admin-notify-badge ds2-admin-notify-badge-bulk">
              Bulk communication
            </span>
          </div>
          <p className="ds2-admin-notify-card-copy">
            Generate and send the monthly immigration update to eligible Pro and Power
            members. This includes the latest Visa Bulletin analysis, key insights, and
            personalized guidance.
          </p>
        </div>
      </div>

      <div className="ds2-admin-notify-details">
        <h3>Campaign details</h3>
        <div className="ds2-admin-notify-table-wrap">
          <table className="ds2-admin-notify-table">
            <tbody>
              <tr>
                <th scope="col">Current Bulletin</th>
                <th scope="col">Bulletin Refreshed</th>
                <th scope="col">Campaign Status</th>
                <th scope="col">Current Campaign</th>
              </tr>
              <tr>
                <td>{displayAdminNotifyValue(summary?.bulletinMonthLabel)}</td>
                <td>
                  {summary?.bulletinRefreshedAt
                    ? formatAdminNotifyTimestamp(summary.bulletinRefreshedAt)
                    : "Not available"}
                </td>
                <td>
                  <p className={campaignStatusClass(summary?.controlStatus)}>
                    {isUnsentCampaignStatus(summary?.controlStatus) ? (
                      <span className="ds2-admin-notify-led" aria-hidden="true" />
                    ) : null}
                    {displayAdminNotifyValue(summary?.controlStatus)}
                  </p>
                </td>
                <td>{currentCampaignLabel}</td>
              </tr>
              <tr>
                <th scope="col">Previous Bulletin</th>
                <th scope="col">Previous Campaign Sent</th>
                <th scope="col" colSpan={2}></th>
              </tr>
              <tr>
                <td>{previousBulletinLabel}</td>
                <td>{previousCampaignSentLabel}</td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <th scope="col">Total Members</th>
                <th scope="col">Pro</th>
                <th scope="col">Power</th>
                <th scope="col">Excluded</th>
              </tr>
              <tr>
                <td>
                  {summary ? summary.activeUserCount.toLocaleString("en-US") : "—"}
                </td>
                <td>{summary ? summary.proCount.toLocaleString("en-US") : "—"}</td>
                <td>{summary ? summary.powerCount.toLocaleString("en-US") : "—"}</td>
                <td>{summary ? summary.skippedCount.toLocaleString("en-US") : "—"}</td>
              </tr>
              <tr>
                <th scope="col">Provider</th>
                <th scope="col" colSpan={3}>
                  Duplicate Send
                </th>
              </tr>
              <tr>
                <td>{displayAdminNotifyValue(summary?.provider)}</td>
                <td colSpan={3}>
                  {summary
                    ? summary.canSend
                      ? "Not blocked"
                      : summary.sendBlockedReason || "Blocked"
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ol className="ds2-admin-notify-steps">
        {WORKFLOW_STEPS.map((step) => {
          const stepState = campaignComplete
            ? " is-complete"
            : step.id === activeStep
              ? " is-current"
              : step.id < activeStep
                ? " is-complete"
                : "";
          return (
            <li key={step.id} className={`ds2-admin-notify-step${stepState}`}>
              <div className="ds2-admin-notify-step-rail">
                <span className="ds2-admin-notify-step-number">{step.id}</span>
              </div>
              <p className="ds2-admin-notify-step-title">{step.title}</p>
              <p className="ds2-admin-notify-step-copy">{step.copy}</p>
            </li>
          );
        })}
      </ol>

      {!campaignComplete ? (
        <div className="ds2-admin-notify-callout">
          <div>
            <h3>Before you send</h3>
            <ul>
              <li>Verify the current Visa Bulletin month is correct</li>
              <li>Review the eligible member count</li>
              <li>Preview the email content to ensure accuracy</li>
              <li>Once sent, emails cannot be unsent</li>
            </ul>
          </div>
          <div className="ds2-admin-notify-actions">
            {canStartBulkWorkflow && workflowStage === "review" ? (
              <button
                type="button"
                className="ds2-admin-notify-primary"
                disabled={busy}
                onClick={() => void handleGenerateMonthlyUpdate()}
              >
                {status === "loading" ? "Refreshing…" : "Generate Monthly Update"}
              </button>
            ) : canStartBulkWorkflow && workflowStage === "generate" ? (
              <p className="ds2-admin-notify-hint">
                Generate a member preview below. No email is sent.
              </p>
            ) : canStartBulkWorkflow && preview ? (
              sendLockedReason ? (
                <p className="ds2-admin-notify-hint">{sendLockedReason}</p>
              ) : (
                <button
                  type="button"
                  className="ds2-admin-notify-primary"
                  disabled={sendDisabled}
                  onClick={openConfirmModal}
                >
                  Continue to Confirm &amp; Send
                </button>
              )
            ) : (
              <p className="ds2-admin-notify-hint">
                {summary?.sendBlockedReason || "Bulk send is not available for this bulletin."}
              </p>
            )}
          </div>
        </div>
      ) : null}

      {showBulkWorkflow ? (
        <div className="ds2-admin-notify-workflow">
          <div className="ds2-admin-notify-field-row">
            <button
              type="button"
              className="ds2-admin-notify-secondary"
              disabled={busy}
              onClick={backToReview}
            >
              Back / Review Audience
            </button>
            <button
              type="button"
              className="ds2-admin-notify-secondary"
              disabled={busy}
              onClick={() => void loadSummary()}
            >
              {status === "loading" ? "Refreshing…" : "Refresh Summary"}
            </button>
          </div>

          <form className="ds2-admin-notify-field" onSubmit={handlePreviewSample}>
            <label htmlFor="notify-group-preview-email">
              {preview ? "Regenerate preview for a member" : "Generate preview for one existing member"}
            </label>
            <div className="ds2-admin-notify-field-row">
              <input
                id="notify-group-preview-email"
                type="email"
                required
                value={previewEmail}
                onChange={(event) => setPreviewEmail(event.target.value)}
                placeholder="Enter existing member's email address"
                disabled={previewStatus === "loading" || busy}
              />
              <button
                type="submit"
                className="ds2-admin-notify-secondary"
                disabled={previewStatus === "loading" || busy || !previewEmail.trim()}
              >
                {previewStatus === "loading"
                  ? "Generating…"
                  : preview
                    ? "Regenerate"
                    : "Generate Preview"}
              </button>
            </div>
            <p className="ds2-admin-notify-help">
              Uses the existing journey-aware preview API. No mass send.
            </p>
          </form>

          {preview ? (
            <div className="ds2-admin-notify-preview">
              <h3>Preview summary</h3>
              <dl>
                <div>
                  <dt>Subject</dt>
                  <dd>{preview.subject}</dd>
                </div>
                <div>
                  <dt>Update month</dt>
                  <dd>{preview.updateMonth}</dd>
                </div>
                <div>
                  <dt>Recipient</dt>
                  <dd>
                    {preview.firstName} · {preview.recipientEmail}
                  </dd>
                </div>
                <div>
                  <dt>Journey</dt>
                  <dd>{journeyLabel(preview)}</dd>
                </div>
                {preview.journeyType === "green_card_holder" ? (
                  <>
                    <div>
                      <dt>Green Card issue date</dt>
                      <dd>{preview.greenCardIssueDate ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Earliest N-400 filing</dt>
                      <dd>{preview.earliestFilingDate ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Days remaining</dt>
                      <dd>{preview.daysRemaining ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Journey status</dt>
                      <dd>{preview.journeyStatus ?? "—"}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <dt>Category</dt>
                      <dd>{preview.immigrationCategory ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Country</dt>
                      <dd>{preview.chargeabilityCountry ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Priority date</dt>
                      <dd>{preview.priorityDate ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Final Action status</dt>
                      <dd>{preview.finalActionStatus ?? "—"}</dd>
                    </div>
                    <div>
                      <dt>Date for Filing status</dt>
                      <dd>{preview.dateForFilingStatus ?? "—"}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          ) : null}

          {preview && previewHtml ? (
            <div className="ds2-admin-notify-preview ds2-admin-notify-email-preview">
              <h3>Email preview</h3>
              <p className="ds2-admin-notify-email-preview-copy">
                This is the email the member will receive.
              </p>
              <div className="ds2-admin-notify-email-frame">
                <iframe
                  title="Monthly Immigration Update email preview"
                  srcDoc={previewHtml}
                  className="ds2-admin-notify-email-iframe"
                  sandbox=""
                />
              </div>
            </div>
          ) : null}

          {previewFeedback ? (
            <p
              className={`ds2-admin-notify-feedback ${
                previewStatus === "error"
                  ? "ds2-admin-notify-feedback-error"
                  : "ds2-admin-notify-feedback-ok"
              }`}
              role="status"
            >
              {previewFeedback}
            </p>
          ) : null}

          {sendResult ? (
            <div className="ds2-admin-notify-preview">
              <h3>
                {sendResult.failureCount > 0
                  ? "Completed with failures"
                  : "Monthly update complete"}
              </h3>
              <dl>
                <div>
                  <dt>Total recipients</dt>
                  <dd>{sendResult.totalRecipients.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Sent successfully</dt>
                  <dd>{sendResult.successCount.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Failed</dt>
                  <dd>{sendResult.failureCount.toLocaleString("en-US")}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>{sendResult.provider}</dd>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`ds2-admin-notify-feedback ${
            status === "error"
              ? "ds2-admin-notify-feedback-error"
              : "ds2-admin-notify-feedback-ok"
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
          campaignStatus={summary.controlStatus}
          confirmLabel={`Confirm & Send to ${summary.totalRecipients.toLocaleString("en-US")} Members`}
          isSubmitting={status === "sending"}
          onCancel={handleCancelConfirm}
          onConfirm={() => void handleConfirmSend()}
        />
      ) : null}
    </section>
  );
}
