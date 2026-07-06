/**
 * Shown when Pro/Power calculator fields were prefilled from the saved profile.
 */
export function CalculatorProfilePrefillHint() {
  return (
    <div
      className="mb-6 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-slate-700"
      role="status"
    >
      <p className="font-medium text-slate-900">Loaded from your immigration profile</p>
      <p className="mt-1 text-slate-600">
        Values were prefilled automatically. Change any field and click Calculate to run a different
        scenario.
      </p>
    </div>
  );
}
