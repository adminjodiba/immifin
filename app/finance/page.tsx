import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { GuideCard } from "@/components/GuideCard";
import { TopicCard } from "@/components/TopicCard";
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
    <PageHeader
      breadcrumb="Finance"
      title="Finance Guides"
      description="Build a strong financial foundation in America. From credit and banking to taxes and investing, we help immigrants make informed money decisions."
    >
      <WorkspaceSection>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {topics.map((topic) => (
            <TopicCard key={topic.title} {...topic} />
          ))}
        </div>
      </WorkspaceSection>

      <WorkspaceSection alt aria-labelledby="all-guides">
        <h2 id="all-guides" className="heading-2">
          All Finance Guides
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {financeGuides.map((guide) => (
            <article key={guide.slug} id={guide.slug} className="scroll-mt-24">
              <GuideCard guide={guide} basePath="/finance" />
            </article>
          ))}
        </div>
      </WorkspaceSection>
    </PageHeader>
  );
}
