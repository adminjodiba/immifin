import Link from "next/link";
import {
  DHS_MODELED_RANDOM_BASELINE,
  DHS_MODELED_SELECTION_ESTIMATES,
  formatSignedPercentagePoints,
} from "@/lib/h1b/h1bLotteryOdds";

const WAGE_ESTIMATOR_HREF = "/immigration/h1b-wage-level-estimator";

const WEIGHTED_ENTRIES: Record<"I" | "II" | "III" | "IV", string> = {
  I: "1×",
  II: "2×",
  III: "3×",
  IV: "4×",
};

/**
 * Crawlable FY2027 search-understanding content for the Lottery Odds page.
 * Server-rendered. Does not change calculator inputs or DHS modeled values.
 */
export function H1bLotteryOddsSeoContent() {
  return (
    <article className="mt-4 space-y-4" aria-label="FY2027 H-1B wage-weighted selection explanation">
      <section
        className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5"
        aria-labelledby="fy2027-weighted-selection"
      >
        <h2 id="fy2027-weighted-selection" className="text-base font-semibold text-slate-900">
          How the FY2027 H-1B Wage-Weighted Selection Works
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          For FY2027, H-1B selection is modeled as wage-weighted by equivalent OEWS wage level. A
          registration is entered into the selection pool according to that level:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          <li>Wage Level I receives 1 weighted entry</li>
          <li>Wage Level II receives 2 weighted entries</li>
          <li>Wage Level III receives 3 weighted entries</li>
          <li>Wage Level IV receives 4 weighted entries</li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Higher weighting improves the modeled selection probability. It does not guarantee that
          any beneficiary will be selected. Actual outcomes depend on the actual registration and
          beneficiary population and the selection process.
        </p>

        <h3 className="mt-5 text-sm font-semibold text-slate-800">
          DHS modeled selection estimates by wage level
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">
              DHS modeled FY2027 H-1B selection estimates by wage level compared with the modeled
              random-selection baseline
            </caption>
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Wage Level
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Weighted Entries
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  DHS Modeled Selection Estimate
                </th>
                <th scope="col" className="px-3 py-2.5 font-medium">
                  Difference from DHS Modeled Random Baseline
                </th>
              </tr>
            </thead>
            <tbody>
              {(["I", "II", "III", "IV"] as const).map((level) => {
                const estimate = DHS_MODELED_SELECTION_ESTIMATES[level];
                const difference = estimate - DHS_MODELED_RANDOM_BASELINE;
                return (
                  <tr key={level} className="border-t border-slate-100">
                    <th scope="row" className="px-3 py-2.5 font-semibold text-slate-900">
                      Level {level}
                    </th>
                    <td className="px-3 py-2.5 text-slate-700">{WEIGHTED_ENTRIES[level]}</td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {estimate.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {formatSignedPercentagePoints(difference)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          DHS modeled random-selection baseline:{" "}
          <strong className="font-semibold text-slate-800">
            {DHS_MODELED_RANDOM_BASELINE.toFixed(2)}%
          </strong>
          . These values are DHS modeled estimates based on the modeling assumptions in the
          applicable weighted-selection analysis. They are not guaranteed individual odds. IMMIFIN
          is not DHS, USCIS, or DOL.
        </p>
      </section>

      <section
        className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5"
        aria-labelledby="masters-degree-selection"
      >
        <h2 id="masters-degree-selection" className="text-base font-semibold text-slate-900">
          Does a U.S. Master&apos;s Degree Affect H-1B Selection?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A qualifying U.S. master&apos;s degree or higher may make a beneficiary eligible for the
          advanced-degree exemption and an additional selection opportunity. IMMIFIN does not add a
          made-up percentage to the DHS wage-level modeled estimate because DHS does not publish a
          separate wage-level-specific combined percentage that IMMIFIN can reliably present.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Don&apos;t know your H-1B wage level? Use IMMIFIN&apos;s{" "}
          <Link
            href={WAGE_ESTIMATOR_HREF}
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            H-1B Wage Level Estimator
          </Link>{" "}
          to estimate Level I, II, III, or IV from an official occupation, worksite ZIP, and salary.
        </p>
      </section>

      <section
        className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5"
        aria-labelledby="lottery-odds-faq"
      >
        <h2 id="lottery-odds-faq" className="text-base font-semibold text-slate-900">
          H-1B Lottery Odds FAQ
        </h2>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          How does the H-1B lottery work for FY2027?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          FY2027 H-1B selection is modeled as wage-weighted. Beneficiaries are entered according to
          wage level (1× through 4×) rather than as a single equal draw. IMMIFIN shows DHS modeled
          selection estimates for that method. It does not predict whether any specific registration
          will be selected.
        </p>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          Does wage level affect H-1B selection?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Yes. In the wage-weighted model, a higher equivalent wage level receives more entries in
          the selection pool. That increases the modeled probability compared with a lower wage
          level. It still does not guarantee selection.
        </p>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          What are the modeled H-1B selection estimates for Wage Levels I, II, III and IV?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          The DHS modeled estimates used by this calculator are Level I {DHS_MODELED_SELECTION_ESTIMATES.I.toFixed(2)}
          %, Level II {DHS_MODELED_SELECTION_ESTIMATES.II.toFixed(2)}%, Level III{" "}
          {DHS_MODELED_SELECTION_ESTIMATES.III.toFixed(2)}%, and Level IV{" "}
          {DHS_MODELED_SELECTION_ESTIMATES.IV.toFixed(2)}%. The DHS modeled random-selection
          baseline is {DHS_MODELED_RANDOM_BASELINE.toFixed(2)}%.
        </p>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          Does a U.S. master&apos;s degree improve H-1B selection chances?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          A qualifying U.S. master&apos;s degree or higher may provide an additional selection
          opportunity through the advanced-degree exemption. IMMIFIN does not invent a combined
          Level × master&apos;s percentage or add a numerical boost to the wage-level estimate.
        </p>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          How do I find my H-1B wage level?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Estimate your likely wage level with the{" "}
          <Link
            href={WAGE_ESTIMATOR_HREF}
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
          >
            H-1B Wage Level Estimator
          </Link>
          . That tool can send the estimated level to this calculator.
        </p>
      </section>
    </article>
  );
}
