import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { createMetadata } from "@/lib/metadata";
import { formatPublicArticleDate, WHY_WE_BUILT_IMMIFIN } from "@/lib/data/public-articles";

export const metadata = createMetadata({
  title: "Why We Built IMMIFIN",
  description:
    "Why IMMIFIN exists: to bring greater clarity to life in America, starting with trusted U.S. immigration tools and insights.",
  path: "/articles/why-we-built-immifin",
});

export default function WhyWeBuiltImmifinArticlePage() {
  return (
    <Ds2PublicPageShell
      eyebrow="Article"
      title={WHY_WE_BUILT_IMMIFIN.title}
      description={`${formatPublicArticleDate(WHY_WE_BUILT_IMMIFIN.date)} · IMMIFIN`}
      layout="reading"
    >
      <article className="ds2-public-prose">
        <p>
          Moving to the United States asks people to make high-stakes decisions from incomplete
          information. Visa rules, wait times, filing dates, and everyday practical questions live
          across government sites, forums, spreadsheets, and advice that may or may not apply to
          your situation.
        </p>
        <p>
          We built IMMIFIN because that fragmentation is exhausting. People should not have to
          assemble a second job out of monitoring bulletins, comparing calculators, and guessing
          whether last month&apos;s answer still holds.
        </p>
        <p>
          The long-term vision is larger than any one form or visa category. IMMIFIN is building a
          trusted platform to help immigrants navigate Immigration, Finance &amp; Life in America.
          Those three parts belong together because the journey does not stop at a petition number.
        </p>
        <p>
          We are starting with U.S. immigration. Today, IMMIFIN offers tools and insights designed
          to bring greater clarity to the immigration journey — including the Current Visa Bulletin
          and public calculators for Green Card wait, citizenship eligibility, H-1B planning, and
          visa stamping wait times.
        </p>
        <p>
          Finance and Life remain part of the destination, not products we claim to offer today. We
          would rather grow narrowly and honestly than market a platform we have not built yet.
        </p>
        <p>
          What will not change is the standard: useful tools, clear explanations, and information
          you can trust. IMMIFIN is not a government agency and does not replace an attorney. We
          exist to help you know where you stand — and stay informed when things change.
        </p>
        <p>The platform will evolve. We will keep that promise as it does.</p>
      </article>
    </Ds2PublicPageShell>
  );
}
