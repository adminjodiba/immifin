/**
 * Crawlable search-understanding copy for the Current Visa Bulletin page.
 * Server-rendered. No data fetching, auth, or client interaction.
 */
export function VisaBulletinUnderstanding() {
  return (
    <section
      aria-labelledby="understanding-visa-bulletin"
      className="rounded-[1.25rem] border border-slate-200/80 bg-white px-4 py-4 sm:px-5 sm:py-5"
    >
      <h2 id="understanding-visa-bulletin" className="text-base font-semibold text-slate-900">
        Understanding the Visa Bulletin
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        The U.S. Department of State publishes the Visa Bulletin each month to show immigrant visa
        availability by preference category and country. IMMIFIN displays the current
        employment-based Final Action Dates and Dates for Filing for EB-1, EB-2 and EB-3.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Final Action Dates</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Final Action Dates indicate when an immigrant visa number is available for final action.
        Compare your Priority Date with the cutoff for your employment category and country.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Dates for Filing</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Dates for Filing may allow applicants to begin parts of the application process before a
        visa number becomes available for final action. For Form I-485 applicants, USCIS determines
        each month which Visa Bulletin chart may be used for filing.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Priority Date and Cutoff Date</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        Your Priority Date represents your place in the immigration queue. If your Priority Date is
        earlier than the applicable cutoff date, that chart has reached your date. If it is later,
        you remain in the waiting queue.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">EB Categories and Countries</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        The dashboard tracks EB-1, EB-2 and EB-3 across China, India, Mexico, the Philippines and
        Rest of the World. Countries with higher visa demand may have different cutoff dates.
      </p>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Reading the Status</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        <strong className="font-semibold text-slate-800">Current</strong>
        {" — "}
        no cutoff date is listed.
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        <strong className="font-semibold text-slate-800">Waiting Queue</strong>
        {" — "}
        a cutoff date applies.
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        <strong className="font-semibold text-slate-800">Unavailable</strong>
        {" — "}
        visa numbers are currently unavailable for that category and country.
      </p>
    </section>
  );
}
