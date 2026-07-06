import Link from "next/link";
import {
  ACTION_CENTER_SUBTITLE,
  getDashboardActionCenterItems,
  type DashboardActionItem,
  type DashboardJourneyStage,
} from "@/lib/dashboard/dashboardFocusAndActions";

type DashboardActionCenterCardProps = {
  journeyStage: DashboardJourneyStage;
  focusId: string;
};

function ActionAvailabilityBadge({ action }: { action: DashboardActionItem }) {
  if (action.comingSoon) {
    return <span className="text-xs font-semibold text-slate-500">Coming Soon</span>;
  }

  if (action.locked) {
    return <span className="text-xs font-semibold text-brand-700">Pro</span>;
  }

  return <span className="text-xs font-semibold text-emerald-700">Available</span>;
}

function actionRowClass(action: DashboardActionItem): string {
  if (action.comingSoon || action.locked) {
    return "bg-slate-50/60";
  }

  return "transition-colors hover:bg-brand-50/40";
}

function ActionTableRow({ action }: { action: DashboardActionItem }) {
  const hasLink = Boolean(action.href && !action.comingSoon);

  return (
    <tr className={`border-b border-slate-100 last:border-b-0 ${actionRowClass(action)}`}>
      <td className="py-3 pr-4 align-top sm:whitespace-nowrap">
        {hasLink ? (
          <Link
            href={action.href!}
            className="text-sm font-semibold text-brand-700 underline underline-offset-2 decoration-brand-300 transition-colors hover:text-brand-800 hover:decoration-brand-500"
          >
            {action.title}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-slate-600">{action.title}</p>
        )}
      </td>
      <td className="py-3 pr-4 align-top">
        {action.description ? (
          <p className="text-xs leading-snug text-slate-500">{action.description}</p>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="py-3 align-top text-right sm:whitespace-nowrap">
        <ActionAvailabilityBadge action={action} />
      </td>
    </tr>
  );
}

export function DashboardActionCenterCard({
  journeyStage,
  focusId,
}: DashboardActionCenterCardProps) {
  const actions = getDashboardActionCenterItems(journeyStage, focusId);

  return (
    <section className="card-static overflow-x-auto">
      <h2 className="heading-3 text-slate-900">Action Center</h2>
      <p className="mt-1 text-sm text-slate-600">{ACTION_CENTER_SUBTITLE}</p>
      <table className="mt-4 w-full min-w-[32rem] text-left">
        <thead>
          <tr className="border-b border-slate-200 text-[0.65rem] font-bold uppercase tracking-wide text-slate-500 sm:text-xs">
            <th className="pb-3 pr-4 font-bold">Action</th>
            <th className="pb-3 pr-4 font-bold">Description</th>
            <th className="pb-3 text-right font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <ActionTableRow key={action.id} action={action} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
