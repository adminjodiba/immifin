import { PageHeader } from "@/components/PageHeader";
import { GuideCard } from "@/components/GuideCard";
import { TopicCard } from "@/components/TopicCard";
import { immigrationGuides } from "@/lib/data/guides";
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
    <>
      <PageHeader
        breadcrumb="Immigration"
        title="Immigration Guides"
        description="Navigate the U.S. immigration system with confidence. Our guides cover visas, green cards, work authorization, and the path to citizenship."
      />

      <section className="section-padding">
        <div className="container-main">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {topics.map((topic) => (
              <TopicCard key={topic.title} {...topic} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding section-alt" aria-labelledby="all-guides">
        <div className="container-main">
          <h2 id="all-guides" className="heading-2 mb-8 sm:mb-10">
            All Immigration Guides
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {immigrationGuides.map((guide) => (
              <article key={guide.slug} id={guide.slug} className="scroll-mt-24">
                <GuideCard guide={guide} basePath="/immigration" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
