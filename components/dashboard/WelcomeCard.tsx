type WelcomeCardProps = {
  name: string;
};

export function WelcomeCard({ name }: WelcomeCardProps) {
  return (
    <section className="ds2-card-static">
      <p className="ds2-workspace-kicker">Your IMMIFIN home</p>
      <h2 className="ds2-workspace-heading mt-2">
        Welcome, {name} 👋
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Here is your IMMIFIN immigration summary.
      </p>
    </section>
  );
}
