import Link from "next/link";

const POWER_FEATURES = [
  "Ask questions using your saved immigration profile",
  "Get clear explanations of your immigration journey",
  "Understand what profile details affect your timeline",
  "Review Visa Bulletin concepts in plain English",
] as const;

type IntelligenceLockedStateProps = {
  /** Compact embedded layout without full-page framing. */
  embedded?: boolean;
};

/**
 * Free / Pro locked state for IMMIFIN Intelligence (Power capability).
 * Does not call the Intelligence API.
 */
export function IntelligenceLockedState({ embedded = false }: IntelligenceLockedStateProps) {
  const content = (
    <div className={embedded ? "space-y-5" : "mx-auto w-full max-w-xl space-y-6"}>
      <header>
        <p className="ds2-workspace-kicker">Power Feature</p>
        <h2 className={`${embedded ? "ds2-workspace-heading text-lg" : "ds2-workspace-heading"} mt-2`}>
          Unlock IMMIFIN AI Advisor with Power
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--immifin-ds2-text-muted)] sm:text-base">
          Ask questions using your saved immigration profile and IMMIFIN&apos;s structured
          immigration context. Answers are informational — they do not determine eligibility or
          replace professional advice.
        </p>
      </header>

      <div className="ds2-card-static p-4 sm:p-5">
        <p className="text-sm font-semibold text-[var(--immifin-ds2-text-primary)]">With Power you can:</p>
        <ul className="mt-3 space-y-2.5">
          {POWER_FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm text-[var(--immifin-ds2-text-primary)]"
            >
              <span
                className="ds2-ai-check"
                aria-hidden="true"
              >
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/pricing#plans" className="btn-primary">
          View Power plan
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          Back to Immigration Dashboard
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="workspace-section" aria-labelledby="intelligence-locked-title">
      <div className="container-main py-6 sm:py-8">
        <h1 id="intelligence-locked-title" className="sr-only">
          IMMIFIN AI Advisor
        </h1>
        {content}
      </div>
    </section>
  );
}
