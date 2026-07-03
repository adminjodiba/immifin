import Link from "next/link";
import type { LivePriorityDateCheck } from "@/lib/visaBulletinData";

const statusStyles = {
  current: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "Current",
  },
  eligible: {
    container: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
    label: "Current",
  },
  waiting: {
    container: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
    badge: "bg-amber-100 text-amber-900",
    dot: "bg-amber-500",
    label: "Waiting",
  },
  unavailable: {
    container: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    label: "Unavailable",
  },
} as const;

type VisaBulletinStatusCardProps = {
  hasCompleteImmigrationProfile: boolean;
  priorityCheck: LivePriorityDateCheck | null;
  priorityCheckError: string | null;
};

export function VisaBulletinStatusCard({
  hasCompleteImmigrationProfile,
  priorityCheck,
  priorityCheckError,
}: VisaBulletinStatusCardProps) {
  if (!hasCompleteImmigrationProfile) {
    return (
      <section className="card-static flex h-full flex-col">
        <h2 className="heading-3 text-slate-900">Visa Bulletin Status</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
          Add your immigration category, country, and priority date to see whether you
          are current or still waiting.
        </p>
        <Link href="/user-profile#/immigration" className="btn-secondary mt-6 w-fit">
          Set up profile
        </Link>
      </section>
    );
  }

  if (priorityCheckError) {
    return (
      <section className="card-static flex h-full flex-col">
        <h2 className="heading-3 text-slate-900">Visa Bulletin Status</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          We could not load your bulletin status right now. Please try again later.
        </p>
        <p className="mt-2 text-xs text-slate-500">{priorityCheckError}</p>
      </section>
    );
  }

  if (!priorityCheck) {
    return (
      <section className="card-static flex h-full flex-col">
        <h2 className="heading-3 text-slate-900">Visa Bulletin Status</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Bulletin status is not available yet.
        </p>
      </section>
    );
  }

  const styles = statusStyles[priorityCheck.status];

  return (
    <section className={`card-static flex h-full flex-col border ${styles.container}`}>
      <h2 className="heading-3 text-slate-900">Visa Bulletin Status</h2>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your status
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
            <p className="text-xl font-bold text-slate-900 sm:text-2xl">{styles.label}</p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
        >
          {styles.label}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Current cutoff
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {priorityCheck.formattedCutoff}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your priority date
          </dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {priorityCheck.priorityDate}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        {priorityCheck.message}
      </p>

      <Link href="/immigration/visa-bulletin" className="link-arrow mt-5 w-fit">
        View Visa Bulletin Dashboard
      </Link>
    </section>
  );
}
