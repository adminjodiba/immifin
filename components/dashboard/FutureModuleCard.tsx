type FutureModuleCardProps = {
  title: string;
  description: string;
};

export function FutureModuleCard({ title, description }: FutureModuleCardProps) {
  return (
    <article className="card-static flex h-full flex-col border-dashed bg-slate-50/40 opacity-90">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Coming Soon
      </p>
      <h3 className="mt-2 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{description}</p>
    </article>
  );
}

const futureModules = [
  {
    title: "Finance Summary",
    description: "Taxes, investing, and retirement planning — connected to your immigration timeline.",
  },
  {
    title: "Insurance Summary",
    description: "Health, life, home, and auto guidance tailored to your life stage.",
  },
] as const;

export function FutureExpansionSection() {
  return (
    <section aria-labelledby="future-expansion">
      <h2 id="future-expansion" className="heading-3 mb-4 text-slate-900">
        Coming Soon
      </h2>
      <p className="mb-5 text-sm text-slate-600">
        IMMIFIN is expanding beyond immigration into your full Life Operating System.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {futureModules.map((module) => (
          <FutureModuleCard key={module.title} {...module} />
        ))}
      </div>
    </section>
  );
}
