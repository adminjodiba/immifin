import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { CalculatorCard } from "@/components/CalculatorCard";
import { calculators } from "@/lib/data/calculators";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Calculators",
  description:
    "Free immigration and finance calculators for visa wait times, taxes, mortgages, credit building, and more.",
  path: "/calculators",
});

const categories = [
  {
    key: "immigration" as const,
    label: "Immigration",
    description: "Visa timelines, green card dates, and lottery odds.",
  },
  {
    key: "finance" as const,
    label: "Finance",
    description: "Mortgages, retirement savings, and credit planning.",
  },
  {
    key: "tax" as const,
    label: "Tax",
    description: "Residency tests and FICA exemption checks.",
  },
  {
    key: "insurance" as const,
    label: "Insurance",
    description: "Health, auto, and renters insurance estimates.",
  },
];

export default function CalculatorsPage() {
  return (
    <PageHeader
      breadcrumb="Calculators"
      title="Calculators"
      description="Free tools to help you plan your immigration timeline, estimate taxes, and make smarter financial decisions in America."
    >
      {categories.map((category, index) => {
        const items = calculators.filter((c) => c.category === category.key);
        return (
          <WorkspaceSection
            key={category.key}
            alt={index % 2 === 1}
            aria-labelledby={`category-${category.key}`}
          >
            <h2 id={`category-${category.key}`} className="heading-2">
              {category.label}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{category.description}</p>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {items.map((calculator) => (
                <article key={calculator.slug} id={calculator.slug} className="scroll-mt-24">
                  <CalculatorCard calculator={calculator} />
                </article>
              ))}
            </div>
          </WorkspaceSection>
        );
      })}
    </PageHeader>
  );
}
