import Link from "next/link";

const lockedFeatures = [
  {
    title: "Personalized Immigration Journey",
    description: "Track Priority Date progress against Visa Bulletin cutoffs.",
  },
  {
    title: "Auto Calculator Population",
    description: "Prefill calculators from your saved immigration profile.",
  },
  {
    title: "Visa Bulletin History",
    description: "Explore historical movement for your category and country.",
  },
  {
    title: "Movement Tracker",
    description: "See month-over-month bulletin changes at a glance.",
  },
  {
    title: "Email Alerts",
    description: "Get notified when your Priority Date becomes current.",
  },
] as const;

export function LockedDashboardPreview() {
  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-brand-600">Pro Feature</p>
        <h2 className="heading-2 mt-2 text-slate-900">Personal Dashboard is a Pro Feature</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Dashboard is available in Pro. Upgrade to Pro to unlock your personalized dashboard,
          auto-filled calculators, movement tracking, alerts, and immigration timeline.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lockedFeatures.map((feature) => (
          <section
            key={feature.title}
            className="card-static border-dashed border-slate-200 bg-slate-50/60"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
              <span className="shrink-0 text-xs font-semibold text-brand-700">🔒 Pro</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href="/pricing" className="btn-primary">
          Upgrade to Pro
        </Link>
        <Link href="/calculators" className="btn-secondary">
          Continue to Free Tools
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        Payments are not enabled yet. Pricing shows plans; billing will connect later.
      </p>
    </div>
  );
}
