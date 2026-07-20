import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";

type HeroProps = {
  title: string;
  subtitle: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  compact?: boolean;
};

export function Hero({ title, subtitle, primaryCta, secondaryCta, compact = false }: HeroProps) {
  if (compact) {
    return (
      <section className="container-main pt-5 sm:pt-6">
        <div className="hero-ribbon relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 shadow-lg shadow-brand-700/15 sm:rounded-3xl">
          <div className="pointer-events-none absolute -right-16 -top-16 z-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div
            className="hero-ribbon-waves"
            aria-hidden="true"
          >
            <div className="hero-ribbon-wave hero-ribbon-wave--1" />
            <div className="hero-ribbon-wave hero-ribbon-wave--2" />
            <div className="hero-ribbon-wave hero-ribbon-wave--3" />
          </div>

          <div className="relative z-10 px-5 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto w-full max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-100">
                Immigration &amp; Finance
              </span>
            </div>
            <div className="hero-ribbon-title-rail mt-3 sm:mt-4">
              <div className="hero-ribbon-title-shuttle">
                <h1 className="hero-ribbon-title-float whitespace-nowrap text-[clamp(0.9rem,3.8vw,2.25rem)] font-bold leading-tight tracking-tight text-white">
                  {title}
                </h1>
              </div>
            </div>
            <div className="mx-auto mt-2 w-full max-w-3xl text-center sm:mt-3">
              <p className="text-sm leading-relaxed text-blue-100 sm:text-base">{subtitle}</p>
              {(primaryCta || secondaryCta) && (
                <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                  {primaryCta && (
                    <ProtectedLink href={primaryCta.href} className="btn-white w-full sm:w-auto">
                      {primaryCta.label}
                    </ProtectedLink>
                  )}
                  {secondaryCta && (
                    <ProtectedLink href={secondaryCta.href} className="btn-ghost-light w-full sm:w-auto">
                      {secondaryCta.label}
                    </ProtectedLink>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-400/30 blur-3xl" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      <div className="container-main relative section-padding !pb-16 !pt-16 sm:!pb-24 sm:!pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-100 backdrop-blur">
            Immigration &amp; Finance
          </span>
          <div className="mt-6 flex items-center justify-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <FavoriteStar pageLabel="Home" pageHref="/" variant="onDark" />
          </div>
          <p className="mt-6 text-base leading-relaxed text-blue-100 sm:text-xl">{subtitle}</p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              {primaryCta && (
                <ProtectedLink href={primaryCta.href} className="btn-white w-full sm:w-auto">
                  {primaryCta.label}
                </ProtectedLink>
              )}
              {secondaryCta && (
                <ProtectedLink href={secondaryCta.href} className="btn-ghost-light w-full sm:w-auto">
                  {secondaryCta.label}
                </ProtectedLink>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
