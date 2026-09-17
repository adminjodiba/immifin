"use client";

import { FormEvent, useState } from "react";
import type { MonthlyUpdatePreviewSummary } from "@/components/admin/admin-notifications-ui";

type ApiResponse = {
  success?: boolean;
  action?: "preview" | "send";
  preview?: MonthlyUpdatePreviewSummary;
  provider?: string;
  providerMessageId?: string | null;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
};

type Status = "idle" | "loadingMember" | "loadingPreview" | "loadingSend" | "success" | "error";

function journeyLabel(preview: MonthlyUpdatePreviewSummary): string {
  return preview.journeyType === "green_card_holder"
    ? "Green Card Holder / Citizenship"
    : "Employment-Based Green Card Waiting";
}

export function AdminNotifyIndividualUser({
  sendLockedReason = null,
}: {
  sendLockedReason?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [member, setMember] = useState<MonthlyUpdatePreviewSummary | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  const busy =
    status === "loadingMember" || status === "loadingPreview" || status === "loadingSend";
  const generateDisabled = !member || status === "loadingMember" || status === "loadingPreview";

  async function postAction(action: "preview" | "send"): Promise<ApiResponse> {
    const response = await fetch(
      "/api/admin/notifications/send-monthly-immigration-update",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: email.trim() }),
      },
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

  async function handleFindMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loadingMember");
    setFeedback(null);
    setMember(null);
    setPreviewVisible(false);

    try {
      const payload = await postAction("preview");
      if (!payload.preview) {
        throw new Error("Member lookup did not return a user summary.");
      }
      setMember(payload.preview);
      setStatus("idle");
      setFeedback("Member found. Review the profile, then generate the preview.");
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error ? error.message : "Failed to find that member.",
      );
    }
  }

  function handleGeneratePreview() {
    if (!member) {
      setStatus("error");
      setFeedback("Find a member first to continue.");
      return;
    }

    setPreviewVisible(true);
    setStatus("idle");
    setFeedback("Review the generated monthly update before sending.");
  }

  async function handleSend() {
    if (sendLockedReason) {
      setStatus("error");
      setFeedback(sendLockedReason);
      return;
    }

    if (!member || !previewVisible) {
      setStatus("error");
      setFeedback("Generate and review the preview before sending.");
      return;
    }

    const confirmed = window.confirm(
      `You are about to send the personalized ${member.updateMonth} Immigration Update to ${member.recipientEmail}.\n\nThis action will send one real email.\n\nContinue?`,
    );
    if (!confirmed) {
      return;
    }

    setStatus("loadingSend");
    setFeedback(null);

    try {
      const payload = await postAction("send");
      if (payload.preview) {
        setMember(payload.preview);
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
          .join(" · "),
      );
    } catch (error: unknown) {
      setStatus("error");
      setFeedback(
        error instanceof Error
          ? error.message
          : "Failed to send Monthly Immigration Update.",
      );
    }
  }

  return (
    <section className="ds2-admin-notify-card" aria-labelledby="notify-individual-heading">
      <div className="ds2-admin-notify-card-head">
        <span
          className="ds2-admin-notify-card-icon ds2-admin-notify-card-icon-individual"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5" />
          </svg>
        </span>
        <div>
          <div className="ds2-admin-notify-card-heading">
            <h2 id="notify-individual-heading" className="ds2-admin-notify-card-title">
              Notify Individual User
            </h2>
            <span className="ds2-admin-notify-badge ds2-admin-notify-badge-individual">
              Individual communication
            </span>
          </div>
          <p className="ds2-admin-notify-card-copy">
            Generate and send a personalized monthly immigration update to a specific member.
          </p>
        </div>
      </div>

      <form className="ds2-admin-notify-field" onSubmit={handleFindMember}>
        <label htmlFor="notify-individual-email">Member Email Address</label>
        <div className="ds2-admin-notify-field-row">
          <input
            id="notify-individual-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setMember(null);
              setPreviewVisible(false);
              setFeedback(null);
              setStatus("idle");
            }}
            placeholder="Enter existing member's email address"
            disabled={busy}
          />
          <button
            type="submit"
            className="ds2-admin-notify-secondary"
            disabled={busy || !email.trim()}
          >
            {status === "loadingMember" ? "Finding…" : "Find Member"}
          </button>
        </div>
        <p className="ds2-admin-notify-help">
          Enter the email address of an existing IMMIFIN member (Pro or Power).
        </p>
      </form>

      {member ? (
        <div className="ds2-admin-notify-preview">
          <h3>Member found</h3>
          <dl>
            <div>
              <dt>Recipient</dt>
              <dd>{member.recipientEmail}</dd>
            </div>
            <div>
              <dt>First name</dt>
              <dd>{member.firstName}</dd>
            </div>
            <div>
              <dt>Journey</dt>
              <dd>{journeyLabel(member)}</dd>
            </div>
            <div>
              <dt>Update month</dt>
              <dd>{member.updateMonth}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      <div className="ds2-admin-notify-callout ds2-admin-notify-callout-individual">
        <div>
          <h3>Member Lookup</h3>
          <ul>
            <li>Enter the member&apos;s email address to find their profile</li>
            <li>Verify the member&apos;s journey and profile information</li>
            <li>Generate a personalized monthly update preview</li>
            <li>Review the content before sending</li>
          </ul>
        </div>
        <div className="ds2-admin-notify-actions">
          <button
            type="button"
            className="ds2-admin-notify-primary"
            disabled={generateDisabled}
            onClick={handleGeneratePreview}
          >
            Generate Preview
          </button>
          {generateDisabled ? (
            <p className="ds2-admin-notify-hint">Find a member first to continue</p>
          ) : previewVisible ? (
            sendLockedReason ? (
              <p className="ds2-admin-notify-hint">{sendLockedReason}</p>
            ) : (
              <button
                type="button"
                className="ds2-admin-notify-secondary"
                disabled={busy}
                onClick={() => void handleSend()}
              >
                {status === "loadingSend" ? "Sending…" : "Send Monthly Update"}
              </button>
            )
          ) : (
            <p className="ds2-admin-notify-hint">Review the member, then generate preview</p>
          )}
        </div>
      </div>

      {previewVisible && member ? (
        <div className="ds2-admin-notify-preview">
          <h3>Preview summary</h3>
          <dl>
            <div>
              <dt>Subject</dt>
              <dd>{member.subject}</dd>
            </div>
            <div>
              <dt>Update month</dt>
              <dd>{member.updateMonth}</dd>
            </div>
            {member.journeyType === "green_card_holder" ? (
              <>
                <div>
                  <dt>Green Card issue date</dt>
                  <dd>{member.greenCardIssueDate ?? "—"}</dd>
                </div>
                <div>
                  <dt>Earliest N-400 filing</dt>
                  <dd>{member.earliestFilingDate ?? "—"}</dd>
                </div>
                <div>
                  <dt>Days remaining</dt>
                  <dd>{member.daysRemaining ?? "—"}</dd>
                </div>
                <div>
                  <dt>Journey status</dt>
                  <dd>{member.journeyStatus ?? "—"}</dd>
                </div>
              </>
            ) : (
              <>
                <div>
                  <dt>Category</dt>
                  <dd>{member.immigrationCategory ?? "—"}</dd>
                </div>
                <div>
                  <dt>Country</dt>
                  <dd>{member.chargeabilityCountry ?? "—"}</dd>
                </div>
                <div>
                  <dt>Priority date</dt>
                  <dd>{member.priorityDate ?? "—"}</dd>
                </div>
                <div>
                  <dt>Final Action status</dt>
                  <dd>{member.finalActionStatus ?? "—"}</dd>
                </div>
                <div>
                  <dt>Date for Filing status</dt>
                  <dd>{member.dateForFilingStatus ?? "—"}</dd>
                </div>
              </>
            )}
          </dl>
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
    </section>
  );
}
