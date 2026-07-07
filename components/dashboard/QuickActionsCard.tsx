import Link from "next/link";

const quickActions = [
  {
    title: "Visa Bulletin Dashboard",
    description: "Browse current Final Action Dates and Dates for Filing.",
    href: "/immigration/visa-bulletin",
    primary: true,
  },
  {
    title: "Green Card Calculator",
    description: "Estimate how long you may wait based on your priority date.",
    href: "/calculators/green-card-wait-time",
  },
  {
    title: "Citizenship Calculator",
    description: "Check your path to U.S. citizenship eligibility.",
    href: "/calculators/citizenship-eligibility",
  },
  {
    title: "Immigration Profile",
    description: "Update your saved category, country, and priority date.",
    href: "/user-profile#/immigration",
  },
  {
    title: "Manage Profile",
    description: "Account settings, contact details, and preferences.",
    href: "/user-profile",
  },
] as const;

export function QuickActionsCard() {
  return (
    <section className="card-static">
      <h2 className="heading-3 text-slate-900">Quick Actions</h2>
      <p className="mt-2 text-sm text-slate-600">
        Jump to the tools you use most.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`group flex flex-col rounded-xl border p-4 transition-colors ${
              "primary" in action && action.primary
                ? "border-brand-200 bg-brand-50/60 hover:border-brand-300 hover:bg-brand-50"
                : "border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
              {action.title}
            </span>
            <span className="mt-1 text-xs leading-relaxed text-slate-600">
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
