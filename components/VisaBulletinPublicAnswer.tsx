import Link from "next/link";
import { VisaBulletinUnderstanding } from "@/components/VisaBulletinUnderstanding";
import type {
  PublicBulletinCell,
  PublicBulletinChartAnswer,
  PublicVisaBulletinAnswer,
  PublicVisaBulletinHistoryPoint,
} from "@/lib/visaBulletinPublicAnswer";
import {
  PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS,
  PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS,
  getPublicVisaBulletinCanonicalPath,
  getPublicVisaBulletinCategoryConfig,
  getPublicVisaBulletinCountryConfig,
} from "@/lib/visaBulletinPublicSlugs";

function displayCell(cell: PublicBulletinCell): string {
  return cell.displayValue ?? "—";
}

function statusBadgeClass(cell: PublicBulletinCell): string {
  switch (cell.semanticState) {
    case "current":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "unavailable":
      return "bg-red-50 text-red-800 ring-red-200";
    case "dated":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function ChartStatusCard({
  heading,
  headingId,
  cell,
}: {
  heading: string;
  headingId: string;
  cell: PublicBulletinCell;
}) {
  return (
    <article className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-3.5 sm:px-5">
      <h2 id={headingId} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {heading}
      </h2>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{displayCell(cell)}</p>
      {cell.statusLabel ? (
        <p className="mt-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${statusBadgeClass(cell)}`}
          >
            {cell.statusLabel}
          </span>
        </p>
      ) : null}
    </article>
  );
}

function ChangeSurface({ title, chart }: { title: string; chart: PublicBulletinChartAnswer }) {
  return (
    <div className="rounded-xl bg-slate-50/90 px-3.5 py-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="mt-2.5 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Previous</dt>
          <dd className="text-right font-medium text-slate-800">{displayCell(chart.previous)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-b border-slate-200/70 pb-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Current</dt>
          <dd className="text-right font-medium text-slate-800">{displayCell(chart.current)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Movement</dt>
          <dd className="text-right font-medium text-slate-800">
            {chart.movement?.movementLabel ?? "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ExploreVisaBulletinLinks({
  currentCategorySlug,
  currentCountrySlug,
}: {
  currentCategorySlug: string;
  currentCountrySlug: string;
}) {
  return (
    <section
      aria-labelledby="explore-visa-bulletin"
      className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
    >
      <h2 id="explore-visa-bulletin" className="text-base font-semibold text-slate-900">
        Explore Visa Bulletin by Category and Country
      </h2>
      <div className="mt-3 space-y-3">
        {PUBLIC_VISA_BULLETIN_CATEGORY_SLUGS.map((categorySlug) => {
          const category = getPublicVisaBulletinCategoryConfig(categorySlug);
          if (!category) {
            return null;
          }

          return (
            <div key={category.slug}>
              <h3 className="text-sm font-semibold text-slate-800">{category.displayLabel}</h3>
              <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm">
                {PUBLIC_VISA_BULLETIN_COUNTRY_SLUGS.map((countrySlug, index) => {
                  const country = getPublicVisaBulletinCountryConfig(countrySlug);
                  const href = getPublicVisaBulletinCanonicalPath(categorySlug, countrySlug);
                  if (!country || !href) {
                    return null;
                  }

                  const isCurrent =
                    categorySlug === currentCategorySlug && countrySlug === currentCountrySlug;

                  return (
                    <span key={href} className="inline-flex items-baseline">
                      {index > 0 ? (
                        <span className="mr-1.5 text-slate-300" aria-hidden="true">
                          ·
                        </span>
                      ) : null}
                      <Link
                        href={href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          isCurrent
                            ? "font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4"
                            : "text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
                        }
                      >
                        {country.displayLabel}
                      </Link>
                    </span>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HistoryList({
  title,
  points,
}: {
  title: string;
  points: PublicVisaBulletinHistoryPoint[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {points.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No recent dates are available for this chart.</p>
      ) : (
        <table className="mt-2.5 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-1.5 pr-3 font-medium">Month</th>
              <th className="pb-1.5 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={`${point.month}-${point.raw}`} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-3 text-slate-500">{point.monthShort}</td>
                <td className="py-1.5 text-right font-medium text-slate-800">{point.displayValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function VisaBulletinPublicAnswer({ answer }: { answer: PublicVisaBulletinAnswer }) {
  const categoryCountry = `${answer.category.displayLabel} ${answer.country.displayLabel}`;
  const heading = `${categoryCountry} Priority Date and Visa Bulletin`;
  const bulletinLabel = answer.bulletin.monthLong ?? answer.bulletin.monthShort ?? "—";

  return (
    <article className="space-y-5">
      <header>
        <h1 className="ds2-data-page-title">{heading}</h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Current Visa Bulletin
        </p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{bulletinLabel}</p>
      </header>

      <section
        aria-label={`${categoryCountry} current Visa Bulletin dates`}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        <ChartStatusCard
          heading="Final Action Date"
          headingId="public-vb-fad"
          cell={answer.fad.current}
        />
        <ChartStatusCard
          heading="Date for Filing"
          headingId="public-vb-dff"
          cell={answer.dff.current}
        />
      </section>

      <section
        aria-labelledby="what-changed-this-month"
        className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
      >
        <h2 id="what-changed-this-month" className="text-base font-semibold text-slate-900">
          What Changed This Month?
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ChangeSurface title="Final Action Date" chart={answer.fad} />
          <ChangeSurface title="Dates for Filing" chart={answer.dff} />
        </div>
      </section>

      <section
        aria-labelledby="recent-visa-bulletin-dates"
        className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
      >
        <h2 id="recent-visa-bulletin-dates" className="text-base font-semibold text-slate-900">
          Recent {categoryCountry} Visa Bulletin Dates
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
          <HistoryList title="Final Action Date" points={answer.recentHistory.fad} />
          <HistoryList title="Date for Filing" points={answer.recentHistory.dff} />
        </div>
      </section>

      <div className="[&_h3]:mt-5 [&_h3]:text-[0.9375rem] [&_p]:mt-2 [&_p]:leading-6">
        <VisaBulletinUnderstanding />
      </div>

      <ExploreVisaBulletinLinks
        currentCategorySlug={answer.category.slug}
        currentCountrySlug={answer.country.slug}
      />

      <section
        aria-labelledby="public-vb-next-steps"
        className="rounded-[1.25rem] border border-slate-200 bg-[#F7F8FB] px-4 py-5 sm:px-5"
      >
        <h2 id="public-vb-next-steps" className="text-lg font-semibold text-slate-900">
          Continue with IMMIFIN
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Sign in to view the full Current Visa Bulletin Dashboard, or estimate wait time with the
          Green Card Wait Calculator.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/immigration/visa-bulletin"
            className="inline-flex items-center justify-center rounded-full bg-[#0B1B3A] px-5 py-2.5 text-sm font-semibold text-white"
          >
            View Full Visa Bulletin Dashboard
          </Link>
          <Link
            href="/calculators/green-card-wait-time"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800"
          >
            Calculate Green Card Wait
          </Link>
        </div>
      </section>

      <p className="px-1 text-[11px] leading-relaxed text-slate-500">
        This page is for informational purposes only and does not constitute legal advice. IMMIFIN
        is not the U.S. Department of State or USCIS. Dates are sourced from the published Visa
        Bulletin and can change when a new bulletin is issued.
      </p>
    </article>
  );
}
