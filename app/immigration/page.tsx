import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { GuideCard } from "@/components/GuideCard";
import { TopicCard } from "@/components/TopicCard";
import { immigrationGuides } from "@/lib/data/guides";
import { immigrationMenuLinks } from "@/lib/immigration-menu";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Immigration",
  description:
    "Expert immigration guides for visas, green cards, OPT, citizenship, and life in America.",
  path: "/immigration",
});

const topics = [
  {
    title: "Work Visas",
    description: "H-1B, L-1, O-1, and other employment-based visa categories.",
    icon: "💼",
  },
  {
    title: "Student Visas",
    description: "F-1, J-1, and OPT/STEM extension pathways for international students.",
    icon: "🎓",
  },
  {
    title: "Permanent Residency",
    description: "Employment-based, family-based, and diversity lottery green card routes.",
    icon: "🏠",
  },
  {
    title: "Citizenship",
    description: "Naturalization requirements, the N-400 process, and the oath ceremony.",
    icon: "🇺🇸",
  },
];

export default function ImmigrationPage() {
  return (
    <PageHeader
      breadcrumb="Immigration"
      title="Immigration Guides"
      description="Navigate the U.S. immigration system with confidence. Our guides cover visas, green cards, work authorization, and the path to citizenship."
    >
      <WorkspaceSection>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {topics.map((topic) => (
            <TopicCard key={topic.title} {...topic} />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {immigrationMenuLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card group flex flex-col"
            >
              <span className="badge bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                Immigration tool
              </span>
              <h2 className="heading-3 mt-4 transition-colors group-hover:text-brand-700">
                {item.label}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
              <span className="link-arrow mt-5">Open dashboard</span>
            </Link>
          ))}
        </div>
      </WorkspaceSection>

      <WorkspaceSection alt aria-labelledby="all-guides">
        <h2 id="all-guides" className="heading-2">
          All Immigration Guides
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {immigrationGuides.map((guide) => (
            <article key={guide.slug} id={guide.slug} className="scroll-mt-24">
              <GuideCard guide={guide} basePath="/immigration" />
            </article>
          ))}
        </div>
      </WorkspaceSection>
    </PageHeader>
  );
}
