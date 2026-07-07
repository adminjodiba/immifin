import Link from "next/link";

type ProFeatureLockedStateProps = {
  /** Optional feature-specific title override. Defaults to "Available in Pro". */
  title?: string;
  continueHref?: string;
  continueLabel?: string;
  /** Compact layout for embedding inside Manage Profile tabs. */
  embedded?: boolean;
};

/**
 * Shared locked state for Pro-only features.
 * Keep copy consistent across dashboard, history, movement, and profile gates.
 */
export function ProFeatureLockedState({
  title = "Available in Pro",
  continueHref = "/immigration/visa-bulletin",
  continueLabel = "Continue with Free Features",
  embedded = false,
}: ProFeatureLockedStateProps) {
  const content = (
    <div className={embedded ? "space-y-5 p-1" : "w-full space-y-6"}>
      <header>
        <p className="text-sm font-medium text-brand-600">Pro Feature</p>
        <h2 className={`${embedded ? "heading-2 text-lg" : "heading-2"} mt-2 text-slate-900`}>
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Upgrade to Pro to unlock personalized immigration tracking, historical analysis,
          automated calculators, alerts, and your personal dashboard.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/pricing" className="btn-primary">
          Upgrade to Pro
        </Link>
        <Link href={continueHref} className="btn-secondary">
          {continueLabel}
        </Link>
      </div>

      <p className="text-xs text-slate-500">
        Payments are not enabled yet. Pricing shows plans; billing will connect later.
      </p>
    </div>
  );

  if (embedded) {
    return content;
  }

  return content;
}
