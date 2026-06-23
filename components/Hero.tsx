import Link from "next/link";

type HeroProps = {
  title: string;
  subtitle: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function Hero({ title, subtitle, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-400 to-brand-600 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      <div className="container-main relative section-padding">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-6 text-lg text-blue-100 sm:text-xl">{subtitle}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {primaryCta && (
                <Link
                  href={primaryCta.href}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:bg-blue-50 sm:w-auto"
                >
                  {primaryCta.label}
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20 sm:w-auto"
                >
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
