"use client";

import { FormEvent, useState } from "react";

type TestEmailResponse = {
  success?: boolean;
  provider?: string;
  providerMessageId?: string | null;
  errorCode?: string;
  errorMessage?: string;
  message?: string;
};

export function AdminNotificationTestForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/notifications/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload = (await response.json().catch(() => ({}))) as TestEmailResponse;

      if (!response.ok || payload.success === false) {
        const details = [
          payload.errorMessage || payload.message || `Request failed (${response.status})`,
          payload.errorCode ? `Code: ${payload.errorCode}` : null,
          payload.provider ? `Provider: ${payload.provider}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        throw new Error(details);
      }

      setStatus("success");
      setFeedback(
        [
          "Test email sent.",
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
      setFeedback(error instanceof Error ? error.message : "Failed to send test email.");
    }
  }

  return (
    <section className="card-static space-y-4">
      <div>
        <h2 className="heading-2">Notification Infrastructure Test</h2>
        <p className="mt-2 text-sm text-slate-600">
          Development-only. Sends one test message through the Notification Platform.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="notification-test-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Recipient email
          </label>
          <input
            id="notification-test-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input-field"
            placeholder="admin@example.com"
            disabled={status === "loading"}
          />
        </div>

        <button
          type="submit"
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Sending…" : "Send Test Email"}
        </button>
      </form>

      {feedback && (
        <p
          className={`text-sm leading-relaxed ${
            status === "error" ? "text-red-700" : "text-emerald-800"
          }`}
          role="status"
        >
          {feedback}
        </p>
      )}
    </section>
  );
}
