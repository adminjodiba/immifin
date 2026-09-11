"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { formatIntelligenceBlockingReason } from "@/lib/intelligence/client/intelligence-profile-labels";
import { INTELLIGENCE_SUGGESTED_QUESTIONS } from "@/lib/intelligence/client/intelligence-suggested-questions";
import { useIntelligenceAsk } from "@/lib/intelligence/client/use-intelligence-ask";
import { INTELLIGENCE_QUESTION_MAX_LENGTH } from "@/lib/intelligence/request/intelligence-request.constants";

const OPERATIONAL_ERROR_KINDS = new Set([
  "unavailable",
  "timeout",
  "not_configured",
  "generic",
  "rate_limited",
]);

/**
 * Power-plan single-turn Intelligence Workspace.
 *
 * - Posts only to /api/intelligence/ask
 * - No history, persistence, streaming, or provider/model selector
 * - Suggested questions populate the composer only
 */
export function IntelligenceWorkspace() {
  const questionId = useId();
  const guidanceId = useId();
  const countId = useId();
  const statusId = useId();
  const errorMessageId = useId();
  const resultHeadingId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const submitLockRef = useRef(false);

  const [question, setQuestion] = useState("");
  const { status, result, isSubmitting, submit, reset } = useIntelligenceAsk();

  const trimmedLength = question.trim().length;
  const remaining = INTELLIGENCE_QUESTION_MAX_LENGTH - question.length;
  const canSubmit =
    !isSubmitting && trimmedLength > 0 && question.length <= INTELLIGENCE_QUESTION_MAX_LENGTH;

  useEffect(() => {
    if (status === "completed" || status === "needs_profile_information" || status === "error") {
      resultRef.current?.focus();
    }
  }, [status, result]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (!canSubmit || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    try {
      await submit(question);
    } finally {
      submitLockRef.current = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function applySuggestion(suggestion: string) {
    if (isSubmitting) {
      return;
    }
    setQuestion(suggestion);
    textareaRef.current?.focus();
  }

  function handleAskAnother() {
    reset();
    setQuestion("");
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }

  const showEmptyGuidance = status === "idle" && !result;
  const showSupportReference =
    result?.kind === "error" &&
    OPERATIONAL_ERROR_KINDS.has(result.errorKind) &&
    typeof result.requestId === "string" &&
    result.requestId.length > 0;

  const textareaDescribedBy =
    result?.kind === "error"
      ? `${guidanceId} ${countId} ${errorMessageId}`
      : `${guidanceId} ${countId}`;

  return (
    <div className="ds2-ai-workspace">
      {showEmptyGuidance ? (
        <section
          className="ds2-card-static p-4 sm:p-5"
          aria-label="Getting started"
        >
          <p className="ds2-workspace-heading text-sm">Suggested questions</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--immifin-ds2-text-muted)] sm:text-sm">
            Choose a suggestion to fill the box below, then review and submit when you are ready.
          </p>
          <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {INTELLIGENCE_SUGGESTED_QUESTIONS.map((suggestion) => (
              <li key={suggestion} className="min-w-0 sm:max-w-full">
                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  aria-label={`Use suggested question: ${suggestion}`}
                  className="ds2-ai-suggestion"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-[var(--immifin-ds2-text-muted)]">
            Your question is used only to prepare this response. IMMIFIN does not save chat history
            for this workspace. Profile completeness affects how useful the answer can be.
          </p>
        </section>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label
            htmlFor={questionId}
            className="block text-sm font-semibold text-[var(--immifin-ds2-text-primary)]"
          >
            Your question
          </label>
          <textarea
            ref={textareaRef}
            id={questionId}
            name="question"
            rows={5}
            value={question}
            disabled={isSubmitting}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-describedby={textareaDescribedBy}
            aria-invalid={result?.kind === "error" && result.errorKind === "validation" ? true : undefined}
            className="ds2-ai-composer"
            placeholder="Ask about your immigration journey, profile details, or Visa Bulletin concepts…"
            maxLength={INTELLIGENCE_QUESTION_MAX_LENGTH}
          />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p id={guidanceId} className="text-xs text-[var(--immifin-ds2-text-muted)]">
              Press Ctrl+Enter or Cmd+Enter to submit. Enter alone starts a new line. One question at
              a time.
            </p>
            <p
              id={countId}
              className={`shrink-0 text-xs tabular-nums ${remaining < 0 ? "text-red-600" : "text-[var(--immifin-ds2-text-muted)]"}`}
              aria-live="polite"
            >
              <span className="sr-only">Character count: </span>
              {question.length} / {INTELLIGENCE_QUESTION_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" className="btn-primary min-h-11" disabled={!canSubmit}>
            {isSubmitting ? "Preparing response…" : "Ask IMMIFIN"}
          </button>
          {status === "completed" ||
          status === "needs_profile_information" ||
          status === "error" ? (
            <button type="button" className="btn-secondary min-h-11" onClick={handleAskAnother}>
              Ask another question
            </button>
          ) : null}
        </div>
      </form>

      <div id={statusId} className="sr-only" aria-live="polite" aria-atomic="true">
        {isSubmitting
          ? "IMMIFIN is preparing your response…"
          : status === "completed"
            ? "Response ready."
            : status === "error"
              ? "There was a problem preparing your response."
              : status === "needs_profile_information"
                ? "Additional profile information is required."
                : ""}
      </div>

      {isSubmitting ? (
        <div
          className="ds2-card-static min-h-[3.25rem] border-[color-mix(in_srgb,var(--immifin-ds2-blue)_28%,var(--immifin-ds2-border))] px-4 py-4 text-sm text-[var(--immifin-ds2-text-primary)]"
          role="status"
        >
          IMMIFIN is preparing your response…
        </div>
      ) : null}

      {result?.kind === "completed" ? (
        <section
          ref={resultRef}
          tabIndex={-1}
          className="ds2-card-static space-y-3 px-4 py-5 sm:px-5"
          aria-labelledby={resultHeadingId}
        >
          <h2 id={resultHeadingId} className="ds2-workspace-heading text-base">
            Response
          </h2>
          <div className="ds2-ai-response">
            {result.answer}
          </div>
          <p className="text-xs leading-relaxed text-[var(--immifin-ds2-text-muted)]">
            Informational only. Verify important decisions with official sources or a qualified
            professional. This response does not determine eligibility.
          </p>
        </section>
      ) : null}

      {result?.kind === "needs_profile_information" ? (
        <section
          ref={resultRef}
          tabIndex={-1}
          className="ds2-card-static space-y-4 border-[color-mix(in_srgb,var(--immifin-ds2-gold)_40%,var(--immifin-ds2-border))] px-4 py-5 sm:px-5"
          aria-labelledby={resultHeadingId}
        >
          <div>
            <h2 id={resultHeadingId} className="ds2-workspace-heading text-base">
              Complete your immigration profile
            </h2>
            <p className="mt-2 text-sm text-[var(--immifin-ds2-text-primary)]">
              IMMIFIN needs a few more profile details before it can prepare a useful response.
            </p>
          </div>
          {result.blockingReasons.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              {result.blockingReasons.map((reason) => (
                <li key={reason}>{formatIntelligenceBlockingReason(reason)}</li>
              ))}
            </ul>
          ) : null}
          <Link href="/user-profile" className="btn-primary inline-flex min-h-11 items-center">
            Open Manage Profile
          </Link>
        </section>
      ) : null}

      {result?.kind === "error" ? (
        <section
          ref={resultRef}
          tabIndex={-1}
          className="ds2-card-static space-y-3 border-red-200 px-4 py-5 sm:px-5"
          role="alert"
          aria-labelledby={resultHeadingId}
        >
          <h2 id={resultHeadingId} className="ds2-workspace-heading text-base">
            Unable to prepare a response
          </h2>
          <p id={errorMessageId} className="text-sm text-[var(--immifin-ds2-text-primary)]">
            {result.message}
          </p>
          {showSupportReference ? (
            <p className="text-xs text-[var(--immifin-ds2-text-muted)]">
              Support reference: <span className="font-mono">{result.requestId}</span>
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {result.errorKind === "unauthenticated" ? (
              <Link href="/login" className="btn-primary inline-flex min-h-11 items-center">
                Sign in again
              </Link>
            ) : null}
            {result.errorKind === "capability_required" ? (
              <Link href="/pricing#plans" className="btn-primary inline-flex min-h-11 items-center">
                View Power plan
              </Link>
            ) : null}
            {result.errorKind === "beta_not_eligible" ? (
              <Link href="/dashboard" className="btn-primary inline-flex min-h-11 items-center">
                Back to Dashboard
              </Link>
            ) : null}
            {result.errorKind === "validation" ||
            result.errorKind === "rate_limited" ||
            result.errorKind === "timeout" ||
            result.errorKind === "unavailable" ||
            result.errorKind === "not_configured" ||
            result.errorKind === "generic" ? (
              <button
                type="button"
                className="btn-secondary min-h-11"
                onClick={() => void handleSubmit()}
              >
                Try again
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--immifin-ds2-text-muted)]">
        IMMIFIN AI Advisor does not provide legal advice, eligibility decisions, or outcome
        predictions. Critical decisions should be verified independently. Controlled beta —
        answers may be incomplete or incorrect.
      </p>
    </div>
  );
}
