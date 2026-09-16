"use client";

import { useState } from "react";

type AdminDatasetRefreshButtonProps = {
  label: string;
  endpoint: string;
};

type RefreshResponse = {
  success?: boolean;
  message?: string;
  metadata?: {
    source?: string;
    lastUpdated?: string;
    count?: number;
  };
};

export function AdminDatasetRefreshButton({ label, endpoint }: AdminDatasetRefreshButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleRefresh() {
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as RefreshResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || `Refresh failed (${response.status})`);
      }

      const details = [
        payload.message || "Refresh complete.",
        payload.metadata?.source ? `Source: ${payload.metadata.source}` : null,
        payload.metadata?.count != null ? `Records: ${payload.metadata.count}` : null,
        payload.metadata?.lastUpdated ? `Sheet date: ${payload.metadata.lastUpdated}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      setStatus("success");
      setMessage(details);
    } catch (error: unknown) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Refresh failed.");
    }
  }

  return (
    <div className="ds2-drc-refresh">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={status === "loading"}
        className="ds2-drc-refresh-btn"
      >
        {status === "loading" ? "Refreshing…" : label}
      </button>
      {message && (
        <p
          className={`ds2-drc-refresh-message ${
            status === "error" ? "ds2-drc-refresh-message-error" : "ds2-drc-refresh-message-success"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
