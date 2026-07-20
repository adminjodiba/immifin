export function GreenCardCongratulationsBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white px-4 py-3 sm:px-5 sm:py-3.5">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-100/60 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative">
        <p className="text-lg font-bold text-emerald-900 sm:text-xl">🎉 Congratulations!</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
          You are now a U.S. Permanent Resident. Your next milestone: U.S. Citizenship.
        </p>
      </div>
    </section>
  );
}
