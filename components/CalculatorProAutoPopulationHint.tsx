import Link from "next/link";

/**
 * Shown on calculators when the user is signed in but lacks
 * accessAutoCalculatorPopulation (Free tier).
 */
export function CalculatorProAutoPopulationHint() {
  return (
    <div
      className="mb-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3 text-sm text-slate-700"
      role="status"
    >
      <p className="font-medium text-slate-900">
        Auto-population from your profile is available in Pro.
      </p>
      <p className="mt-1 text-slate-600">
        Enter your details manually below, or{" "}
        <Link href="/pricing" className="font-semibold text-brand-700 hover:text-brand-800">
          upgrade to Pro
        </Link>{" "}
        to prefill calculators from your saved profile.
      </p>
    </div>
  );
}
