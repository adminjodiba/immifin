export function GreenCardCongratulationsBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-100/60 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-2xl font-bold text-emerald-900 sm:text-3xl">🎉 Congratulations!</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          You are now a U.S. Permanent Resident.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Let&apos;s plan your next milestone: U.S. Citizenship.
        </p>
      </div>
    </section>
  );
}
