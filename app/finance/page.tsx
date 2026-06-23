import { PageHeader } from "@/components/PageHeader";
import { GuideCard } from "@/components/GuideCard";
import { financeGuides } from "@/lib/data/guides";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Finance",
  description:
    "Financial guides for immigrants: building credit, filing taxes, investing, and banking in America.",
  path: "/finance",
});

const topics = [
  {
    title: "Credit & Banking",
    description: "Open accounts, build credit history, and avoid common pitfalls as a newcomer.",
    icon: "💳",
  },
  {
    title: "Taxes",
    description: "Resident vs. non-resident filing, ITINs, deductions, and state taxes.",
    icon: "📋",
  },
  {
    title: "Investing",
    description: "401(k)s, IRAs, brokerage accounts, and long-term wealth building strategies.",
    icon: "📈",
  },
  {
    title: "Insurance",
    description: "Health, auto, renters, and life insurance essentials for immigrants.",
    icon: "🛡️",
  },
];

export default function FinancePage() {
  return (
    <>
      <PageHeader
        breadcrumb="Finance"
        title="Finance Guides"
        description="Build a strong financial foundation in America. From credit and banking to taxes and investing, we help immigrants make informed money decisions."
      />

      <section className="section-padding">
        <div className="container-main">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <div key={topic.title} className="card text-center">
                <span className="text-3xl" role="img" aria-hidden="true">
                  {topic.icon}
                </span>
                <h2 className="heading-3 mt-4">{topic.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white" aria-labelledby="all-guides">
        <div className="container-main">
          <h2 id="all-guides" className="heading-2 mb-10">
            All Finance Guides
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {financeGuides.map((guide) => (
              <article key={guide.slug} id={guide.slug} className="scroll-mt-24">
                <GuideCard guide={guide} basePath="/finance" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
