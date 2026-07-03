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

function actionRowClass(action: DashboardActionItem, interactive: boolean): string {
  const base = "rounded-xl border px-4 py-3";

  if (action.comingSoon || !interactive) {
    return `${base} border-dashed border-slate-200 bg-slate-50/60`;
  }

  if (action.locked) {
    return `${base} border-dashed border-slate-200 bg-slate-50/60 transition-colors hover:border-slate-300`;
  }

  return `${base} border-slate-200 bg-white transition-colors hover:border-brand-200 hover:bg-brand-50/40`;
}

function ActionRow({ action }: { action: DashboardActionItem }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{action.title}</p>
        {action.description ? (
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{action.description}</p>
        ) : null}
      </div>
      <div className="shrink-0 pl-3">
        <ActionAvailabilityBadge action={action} />
      </div>
    </>
  );

  if (action.comingSoon || !action.href) {
    return (
      <div className={actionRowClass(action, false)}>
        <div className="flex items-start justify-between gap-2">{content}</div>
      </div>
    );
  }

  return (
    <Link href={action.href} className={`block ${actionRowClass(action, true)}`}>
      <div className="flex items-start justify-between gap-2">{content}</div>
    </Link>
  );
}

export function DashboardActionCenterCard({
  journeyStage,
  focusId,
}: DashboardActionCenterCardProps) {
  const actions = getDashboardActionCenterItems(journeyStage, focusId);

  return (
    <section className="card-static">
      <h2 className="heading-3 text-slate-900">Action Center</h2>
      <p className="mt-1 text-sm text-slate-600">{ACTION_CENTER_SUBTITLE}</p>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((action) => (
          <ActionRow key={action.id} action={action} />
        ))}
      </div>
    </section>
  );
}
