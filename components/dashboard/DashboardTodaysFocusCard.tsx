import Link from "next/link";
import type { FocusBadge, TodaysFocus } from "@/lib/dashboard/dashboardFocusAndActions";

type DashboardTodaysFocusCardProps = {
  focus: TodaysFocus;
};

const badgeStyles: Record<FocusBadge, string> = {
  Recommended: "bg-brand-100 text-brand-800",
  Current: "bg-emerald-100 text-emerald-800",
  Waiting: "bg-amber-100 text-amber-800",
  "Coming Soon": "bg-slate-100 text-slate-600",
};

export function DashboardTodaysFocusCard({ focus }: DashboardTodaysFocusCardProps) {
  return (
    <section className="card-static border-brand-200 bg-gradient-to-br from-brand-50/80 to-white">
      <div className="flex items-start justify-between gap-3">
        <h2 className="heading-3 text-slate-900">Today&apos;s Focus</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[focus.badge]}`}
        >
          {focus.badge}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">{focus.focusTitle}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{focus.message}</p>

      {focus.ctaLabel && focus.ctaHref ? (
        <Link href={focus.ctaHref} className="btn-primary mt-4 inline-flex w-full justify-center">
          {focus.ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
