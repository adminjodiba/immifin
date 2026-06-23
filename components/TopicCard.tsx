type TopicCardProps = {
  title: string;
  description: string;
  icon: string;
};

export function TopicCard({ title, description, icon }: TopicCardProps) {
  return (
    <div className="card-static group text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-200/50">
      <span
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-2xl shadow-sm ring-1 ring-brand-100 transition-transform group-hover:scale-105"
        role="img"
        aria-hidden="true"
      >
        {icon}
      </span>
      <h2 className="heading-3 mt-5">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
    </div>
  );
}
