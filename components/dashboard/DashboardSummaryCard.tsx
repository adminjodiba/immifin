type DashboardSummaryCardProps = {
  title: string;
  value: string;
  detail?: string;
};

export function DashboardSummaryCard({ title, value, detail }: DashboardSummaryCardProps) {
  return (
    <article className="card-static">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p> : null}
    </article>
  );
}
