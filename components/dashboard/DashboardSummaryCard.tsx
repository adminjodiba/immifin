type DashboardSummaryCardProps = {
  title: string;
  value: string;
  detail?: string;
};

export function DashboardSummaryCard({ title, value, detail }: DashboardSummaryCardProps) {
  return (
    <article className="rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{detail}</p> : null}
    </article>
  );
}
