type WelcomeCardProps = {
  name: string;
};

export function WelcomeCard({ name }: WelcomeCardProps) {
  return (
    <section className="card-static">
      <p className="text-sm font-medium text-brand-600">Your IMMIFIN home</p>
      <h2 className="heading-3 mt-2 text-slate-900">
        Welcome, {name} 👋
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Here is your IMMIFIN immigration summary.
      </p>
    </section>
  );
}
