export const GREEN_CARD_WAIT_SEO_DOS_VISA_BULLETIN_HREF =
  "https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html";

export const GREEN_CARD_WAIT_SEO_USCIS_FILING_CHART_HREF =
  "https://www.uscis.gov/green-card/green-card-processes-and-procedures/visa-availability-priority-dates/adjustment-of-status-filing-charts-from-the-visa-bulletin";

const headingClassName = "text-base font-semibold text-slate-900";
const bodyClassName = "mt-2 text-sm leading-relaxed text-slate-600";
const followOnClassName = "mt-3 text-sm leading-relaxed text-slate-600";
const questionClassName = "text-sm font-semibold text-slate-800";
const sourceLinkClassName =
  "font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800";

/**
 * Crawlable search-understanding content for the Green Card Wait Time Calculator.
 * Server-rendered. Does not change inputs, comparison logic, or entitlements.
 */
export function GreenCardWaitTimeSeoContent() {
  return (
    <article
      className="mt-4 rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-5 sm:px-6 sm:py-6"
      aria-label="Green card wait time explanation"
    >
      <section aria-labelledby="eb2-eb3-india-wait-times">
        <h2 id="eb2-eb3-india-wait-times" className={headingClassName}>
          EB-2 and EB-3 India Wait Times
        </h2>
        <p className={bodyClassName}>
          EB-2 and EB-3 are separate employment-based preference categories. India has its own
          Visa Bulletin column, so an EB-2 India green card wait time and an EB-3 India green card
          wait time can differ. Your priority date must be compared with the applicable
          category-and-country Final Action Date, not with another category or country.
        </p>
        <p className={followOnClassName}>
          Those published cutoffs can change from one Visa Bulletin to the next. IMMIFIN shows
          current status against the latest Final Action Date used by the calculator. It does not
          forecast when an India priority date will become current. Review the official{" "}
          <a
            href={GREEN_CARD_WAIT_SEO_DOS_VISA_BULLETIN_HREF}
            className={sourceLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            U.S. Department of State Visa Bulletin
          </a>{" "}
          for the government publication.
        </p>
      </section>

      <div className="mt-7 space-y-6 border-t border-slate-200/80 pt-7">
        <section aria-labelledby="final-action-vs-dates-for-filing">
          <h2 id="final-action-vs-dates-for-filing" className={headingClassName}>
            Final Action Dates vs. Dates for Filing
          </h2>
          <p className={bodyClassName}>
            This calculator uses the applicable current published Final Action Date for its
            current-status comparison. Final Action Dates indicate when an immigrant visa number may
            be available for final action, subject to the applicable immigration process and
            requirements.
          </p>
          <p className={followOnClassName}>
            Dates for Filing are a separate Visa Bulletin chart. They relate to when applicants may
            be able to take filing or documentation steps if applicable government guidance permits
            use of that chart. A Dates for Filing cutoff is not the same as approval eligibility, and
            a priority date earlier than a Dates for Filing cutoff does not guarantee that filing is
            allowed in every circumstance. Adjustment-of-status applicants should follow{" "}
            <a
              href={GREEN_CARD_WAIT_SEO_USCIS_FILING_CHART_HREF}
              className={sourceLinkClassName}
              target="_blank"
              rel="noopener noreferrer"
            >
              USCIS guidance on which Visa Bulletin chart may be used
            </a>{" "}
            for the relevant month. This page is informational and is not legal advice.
          </p>
        </section>

        <section aria-labelledby="understanding-visa-bulletin-movement">
          <h2 id="understanding-visa-bulletin-movement" className={headingClassName}>
            Understanding Visa Bulletin Movement
          </h2>
          <p className={bodyClassName}>
            Published cutoff dates can advance, remain unchanged, or retrogress. A category and
            country combination can also become unavailable when visa numbers are not being issued
            in that chart. Historical movement can provide context for how a cutoff has changed, but
            past movement does not guarantee future movement.
          </p>
          <p className={followOnClassName}>
            Because cutoffs can move in either direction, a current-status result is a snapshot
            against the published Final Action Date used by the calculator. It is not a forecast of
            the next Visa Bulletin.
          </p>
        </section>
      </div>

      <section
        className="mt-7 border-t border-slate-200/80 pt-7"
        aria-labelledby="green-card-wait-time-faq"
      >
        <h2 id="green-card-wait-time-faq" className={headingClassName}>
          Green Card Wait Time FAQ
        </h2>
        <div className="mt-4 divide-y divide-slate-200/80">
          <div className="pb-4">
            <h3 className={questionClassName}>
              How do I check where my green card priority date stands?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Enter Employment Category, Country of Chargeability, and Priority Date. IMMIFIN
              compares those inputs with the current published Final Action Date. The result is
              current status, not a future approval date.
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>What does it mean when my priority date is current?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              On this calculator&apos;s Final Action Date chart, Current means no cutoff is being
              applied for that category and country. That is Visa Bulletin status only. It does not
              guarantee immediate approval.
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>
              What is the difference between Final Action Dates and Dates for Filing?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Final Action Dates concern visa-number availability for final action; this calculator
              uses that current published chart. Dates for Filing are a separate chart that may
              allow earlier filing or documentation steps when applicable guidance permits. Dates
              for Filing do not mean a green card can be approved.
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>Why can EB-2 or EB-3 India wait times change?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Visa numbers are limited, and demand can exceed availability. EB-2 India and EB-3
              India are tracked separately, so their published cutoffs can move differently. IMMIFIN
              does not predict the next update.
            </p>
          </div>

          <div className="pt-4">
            <h3 className={questionClassName}>Can the Visa Bulletin move backward?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Yes. Retrogression is when a previously advanced cutoff moves backward because demand
              and visa-number availability require it. A category can also become unavailable. Past
              movement does not guarantee the next chart.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
