import { PETITION_BASED_WAIT_ESTIMATE_NOTE } from "@/lib/visa/visaStampingWaitTimes";

export const VISA_STAMPING_SEO_DOS_WAIT_TIMES_HREF =
  "https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/wait-times.html";

const headingClassName = "text-base font-semibold text-slate-900";
const bodyClassName = "mt-2 text-sm leading-relaxed text-slate-600";
const followOnClassName = "mt-3 text-sm leading-relaxed text-slate-600";
const questionClassName = "text-sm font-semibold text-slate-800";

/**
 * Crawlable search-understanding content for the Visa Stamping Wait Map.
 * Server-rendered. Does not change filters, map, ranking, or wait-time data.
 */
export function VisaStampingWaitMapSeoContent() {
  return (
    <article
      className="mt-4 rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-5 sm:px-6 sm:py-6"
      aria-label="U.S. visa appointment wait times explanation"
    >
      <section aria-labelledby="us-visa-appointment-wait-times">
        <h2 id="us-visa-appointment-wait-times" className={headingClassName}>
          U.S. Visa Appointment Wait Times
        </h2>
        <p className={bodyClassName}>
          This page shows published U.S. visa appointment wait-time estimates at consulates
          worldwide. IMMIFIN uses the U.S. Department of State Visa Appointment Wait Times as the
          government source. The figures are estimates of how long it may take to get an interview
          appointment. They are not live appointment inventory and do not guarantee that a slot is
          available.
        </p>
        <p className={followOnClassName}>
          Use the map and ranked list to compare consulates for a selected country and visa type.
          Open a consulate for details and, where history exists, recorded change over time. Review
          the official{" "}
          <a
            href={VISA_STAMPING_SEO_DOS_WAIT_TIMES_HREF}
            className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            Department of State visa appointment wait times
          </a>{" "}
          for the government publication.
        </p>
      </section>

      <div className="mt-7 space-y-6 border-t border-slate-200/80 pt-7">
        <section aria-labelledby="h1b-visa-appointment-wait-times">
          <h2 id="h1b-visa-appointment-wait-times" className={headingClassName}>
            H-1B Visa Appointment Wait Times
          </h2>
          <p className={bodyClassName}>
            You can select H-1B as the visa type in IMMIFIN. The Department of State does not publish
            a separate H-1B-only appointment wait estimate. {PETITION_BASED_WAIT_ESTIMATE_NOTE} Other
            petition-based selections such as H-4, L-1, L-2, O, P, and Q use that same published
            category.
          </p>
          <p className={followOnClassName}>
            These values remain appointment wait estimates. They do not mean a consulate currently
            has an open H-1B interview slot, and they do not guarantee when an appointment will be
            offered.
          </p>
        </section>

        <section aria-labelledby="h1b-wait-times-india">
          <h2 id="h1b-wait-times-india" className={headingClassName}>
            H-1B Visa Appointment Wait Times in India
          </h2>
          <p className={bodyClassName}>
            For India, IMMIFIN can compare the supported U.S. consular posts: Chennai, Hyderabad,
            Kolkata, Mumbai, and New Delhi. Select India and H-1B in the filters above to see the
            current published petition-based estimate for each post. Those current day counts come
            from the latest Department of State snapshot shown in the tool and can change when the
            government updates the source.
          </p>
        </section>
      </div>

      <div className="mt-7 space-y-6 border-t border-slate-200/80 pt-7">
        <section aria-labelledby="compare-consulate-wait-times">
          <h2 id="compare-consulate-wait-times" className={headingClassName}>
            Compare U.S. Consulate Wait Times
          </h2>
          <p className={bodyClassName}>
            The ranked list and map help you compare locations side by side. Summary cards highlight
            the shortest and longest current estimates in the selected set. Where earlier snapshots
            exist, History Trend shows how a post&apos;s published wait estimate has changed. Movement
            labels describe recorded change; they do not predict future wait times.
          </p>
        </section>

        <section aria-labelledby="how-to-use-wait-map">
          <h2 id="how-to-use-wait-map" className={headingClassName}>
            How to Use the Visa Stamping Wait Map
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
            <li>Choose a country, or Worldwide, to set the posts you want to compare.</li>
            <li>Choose a visa type, such as H-1B, visitor, or student.</li>
            <li>Compare consulates on the map and in the ranked wait-time list.</li>
            <li>Open a consulate for details and History Trend when history is available.</li>
          </ol>
        </section>
      </div>

      <section
        className="mt-7 border-t border-slate-200/80 pt-7"
        aria-labelledby="visa-appointment-wait-times-faq"
      >
        <h2 id="visa-appointment-wait-times-faq" className={headingClassName}>
          Visa Appointment Wait Times FAQ
        </h2>
        <div className="mt-4 divide-y divide-slate-200/80">
          <div className="pb-4">
            <h3 className={questionClassName}>
              What is a U.S. visa appointment wait time?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              It is the Department of State&apos;s published estimate of how long it may take to get a
              visa interview appointment at a consulate. IMMIFIN displays that estimate so you can
              compare posts. It is not a personal case timeline.
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>
              Are IMMIFIN visa wait times real-time appointment availability?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              No. IMMIFIN shows published Department of State appointment wait-time estimates. They are
              not live appointment inventory and do not guarantee that a booking is available.
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>
              Does the Department of State publish a separate H-1B appointment wait time?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              No. {PETITION_BASED_WAIT_ESTIMATE_NOTE}
            </p>
          </div>

          <div className="py-4">
            <h3 className={questionClassName}>
              Which U.S. consulates in India can I compare for H-1B wait times?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              IMMIFIN compares the supported India posts: Chennai, Hyderabad, Kolkata, Mumbai, and New
              Delhi. Current estimates appear in the interactive tool after you select India and H-1B.
            </p>
          </div>

          <div className="pt-4">
            <h3 className={questionClassName}>
              Can visa appointment wait times change?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Yes. The Department of State updates published wait estimates over time. A later snapshot
              can be shorter or longer than the previous one. History Trend shows recorded change where
              earlier data exists; it does not predict the next update.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
