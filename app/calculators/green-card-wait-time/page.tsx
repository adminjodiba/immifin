import Link from "next/link";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { Ds2CalculatorPageShell } from "@/components/ds2/Ds2CalculatorPageShell";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { GreenCardWaitTimeCalculator } from "@/components/GreenCardWaitTimeCalculator";
import { createMetadata } from "@/lib/metadata";

const PAGE_HREF = "/calculators/green-card-wait-time";
const PAGE_TITLE = "Employment-Based Green Card Wait Time Calculator";

export const metadata = createMetadata({
  title: PAGE_TITLE,
  description:
    "Check where your employment-based priority date stands against the current Visa Bulletin Final Action Date. This is current status, not a prediction of when a Green Card will be approved.",
  path: PAGE_HREF,
});

export default function GreenCardWaitTimePage() {
  return (
    <Ds2CalculatorPageShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
                  {PAGE_TITLE}
                </h1>
                <FavoriteStar pageLabel={PAGE_TITLE} pageHref={PAGE_HREF} />
              </div>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Check where your employment-based priority date stands against the current Visa
                Bulletin.
              </p>
              <p className="mt-1.5 max-w-3xl text-sm text-slate-600">
                This calculator compares your priority date with the published Final Action Date
                for your category and country. It shows your current status. It does not predict
                future Visa Bulletin movement or when USCIS will approve a Green Card.
              </p>
            </div>
          </div>
          <DashboardCloseAction />
        </header>

        <GreenCardWaitTimeCalculator>
          <section
            aria-labelledby="gc-wait-result-meanings"
            className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
          >
            <h2 id="gc-wait-result-meanings" className="text-base font-semibold text-slate-900">
              What Your Result Means
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-slate-900">Current</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The Visa Bulletin lists this category and country as Current. A Final Action Date
                  cutoff is not being applied in the published chart. This is Visa Bulletin status
                  only and does not mean USCIS has approved a Green Card.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Eligible</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  Your priority date is on or before the published Final Action Date. The current
                  Final Action chart has reached your priority date. This does not by itself mean
                  your Green Card is approved.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Still Waiting</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  Your priority date is later than the published Final Action Date. You remain
                  behind the current cutoff. IMMIFIN does not estimate how many months or years
                  this will take because Visa Bulletin cutoffs can move forward, remain unchanged,
                  or retrogress.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Unavailable</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The published Final Action chart lists visa numbers as unavailable for this
                  combination. IMMIFIN does not treat Unavailable as a calendar date and does not
                  estimate a future wait from it.
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-labelledby="gc-wait-how-it-works"
            className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
          >
            <h2 id="gc-wait-how-it-works" className="text-base font-semibold text-slate-900">
              How This Calculator Works
            </h2>
            <ol className="mt-3 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {[
                "Enter your employment category, country of chargeability, and Priority Date.",
                "IMMIFIN uses the current published Visa Bulletin Final Action Date for that category and country through the existing Visa Bulletin data pipeline.",
                "IMMIFIN compares your Priority Date with the current Final Action Date.",
                "The calculator reports your current Visa Bulletin status.",
              ].map((step, index) => (
                <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              This is a current-status comparison. It does not predict future Visa Bulletin
              movement.
            </p>
          </section>

          <section
            aria-labelledby="gc-wait-education"
            className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5"
          >
            <h2 id="gc-wait-education" className="text-base font-semibold text-slate-900">
              Priority Date and Visa Bulletin
            </h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-slate-900">Priority Date</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The date used to place your case in line for an immigrant visa number. For
                  employment-based cases, it is typically the date listed on your I-140, I-130, or
                  PERM approval notice.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Final Action Date</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The published Visa Bulletin cutoff. A priority date on or before this date has
                  been reached by the current Final Action chart.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Current</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The Visa Bulletin lists this category and country as Current. A Final Action Date
                  cutoff is not being applied in the published chart.
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-900">Unavailable</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  The published Final Action chart lists visa numbers as unavailable for this
                  combination.
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-semibold text-slate-900">
                  Final Action Date vs Date for Filing
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  This calculator uses Final Action Date only. Date for Filing is a separate Visa
                  Bulletin chart that can open earlier for filing. The corresponding public Visa
                  Bulletin page can show both charts.
                </dd>
              </div>
            </dl>
          </section>
        </GreenCardWaitTimeCalculator>

        <section
          aria-labelledby="gc-wait-continue"
          className="rounded-[1.25rem] border border-slate-200 bg-[#F7F8FB] px-4 py-5 sm:px-5"
        >
          <h2 id="gc-wait-continue" className="text-lg font-semibold text-slate-900">
            Continue with IMMIFIN
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            This calculator is free. An IMMIFIN account can save an immigration profile. Pro can
            auto-fill this calculator and provides priority-date tracking, Visa Bulletin History,
            Movement, and email alerts where those capabilities are currently supported.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#0B1B3A] px-5 py-2.5 text-sm font-semibold text-white sm:w-auto"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </section>

        <p className="px-1 text-[11px] leading-relaxed text-slate-500">
          This page is for informational purposes only and is not legal advice. IMMIFIN compares
          your priority date with the current published Visa Bulletin Final Action Date. It does
          not predict future Visa Bulletin movement, USCIS processing time, or a Green Card
          approval date. A Current or Eligible result does not by itself mean a Green Card will be
          approved.
        </p>
      </div>
    </Ds2CalculatorPageShell>
  );
}
