import Link from "next/link";

type CtaBannerProps = {
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function CtaBanner({ title, description, primaryCta, secondaryCta }: CtaBannerProps) {
  return (
    <section className="section-padding">
      <div className="container-main">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-6 py-12 text-center shadow-xl shadow-brand-700/20 sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
            {description}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href={primaryCta.href} className="btn-white w-full sm:w-auto">
              {primaryCta.label}
            </Link>
            {secondaryCta && (
              <Link href={secondaryCta.href} className="btn-ghost-light w-full sm:w-auto">
                {secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
