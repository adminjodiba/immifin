export function JourneyExplanationCard() {
  return (
    <section className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-5 sm:p-6">
      <p className="text-sm leading-relaxed text-slate-700">
        We compare your <span className="font-semibold text-slate-900">Priority Date</span> with
        the current Visa Bulletin cutoff dates.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">
        <span className="font-semibold text-emerald-700">Green</span> means the Visa Bulletin has
        reached your Priority Date.{" "}
        <span className="font-semibold text-red-700">Red</span> means you are still waiting.
      </p>
    </section>
  );
}
