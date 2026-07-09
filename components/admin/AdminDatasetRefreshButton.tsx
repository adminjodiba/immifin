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
    <div className="space-y-2 border-t border-slate-200/80 pt-3">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={status === "loading"}
        className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-brand-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Refreshing…" : label}
      </button>
      {message && (
        <p
          className={`text-xs leading-relaxed ${
            status === "error" ? "text-red-700" : "text-emerald-800"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
