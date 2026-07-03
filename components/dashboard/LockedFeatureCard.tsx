type LockedFeatureCardProps = {
  title: string;
  tier: "Pro" | "Power";
  description: string;
};

export function LockedFeatureCard({ title, tier, description }: LockedFeatureCardProps) {
  return (
    <article className="card-static flex h-full flex-col border-dashed bg-slate-50/60">
      <div className="flex items-start gap-3">
        <span className="text-lg" aria-hidden="true">
          🔒
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Available in {tier}
          </p>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
    </article>
  );
}

const lockedFeatures = [
  {
    title: "Visa Bulletin History",
    tier: "Pro" as const,
    description: "Review how cutoffs have moved over time for your category and country.",
  },
  {
    title: "Movement Tracker",
    tier: "Pro" as const,
    description: "Track month-over-month bulletin movement without manual spreadsheets.",
  },
  {
    title: "Email Alerts",
    tier: "Pro" as const,
    description: "Get notified when bulletin updates may affect your case.",
  },
  {
    title: "AI Immigration Assistant",
    tier: "Power" as const,
    description: "Ask questions and get guidance tailored to your immigration profile.",
  },
] as const;

export function LockedPremiumFeaturesSection() {
  return (
    <section aria-labelledby="locked-premium-features">
      <h2 id="locked-premium-features" className="heading-3 mb-4 text-slate-900">
        Premium Features
      </h2>
      <p className="mb-5 text-sm text-slate-600">
        Upgrade when you are ready for automation and intelligence — free tools stay accurate.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {lockedFeatures.map((feature) => (
          <LockedFeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
