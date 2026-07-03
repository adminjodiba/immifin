export function CitizenshipLockedAiCard() {
  return (
    <section className="card-static border-dashed bg-slate-50/60">
      <p className="text-sm font-semibold text-slate-900">Need Personalized Guidance?</p>
      <div className="mt-3 flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">
          🔒
        </span>
        <div>
          <h3 className="text-base font-semibold text-slate-900">AI Immigration Assistant</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Available in Power
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Get personalized citizenship guidance based on your profile and timeline.
          </p>
        </div>
      </div>
    </section>
  );
}
