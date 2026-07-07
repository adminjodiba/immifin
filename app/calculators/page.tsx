import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { CalculatorCard } from "@/components/CalculatorCard";
import { calculators } from "@/lib/data/calculators";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Calculators",
  description:
    "Immigration and finance calculators for visa wait times, taxes, mortgages, credit building, and more.",
  path: "/calculators",
});

const categories = [
  { key: "immigration" as const, label: "Immigration" },
  { key: "finance" as const, label: "Finance" },
  { key: "tax" as const, label: "Tax" },
  { key: "insurance" as const, label: "Insurance" },
];

export default function CalculatorsPage() {
  return (
    <PageHeader
      title="Calculators"
      description="Tools to help you plan your immigration timeline, estimate taxes, and make smarter financial decisions in America."
      descriptionClassName="mt-1 text-sm text-slate-600 lg:whitespace-nowrap"
    >
      {categories.map((category, index) => {
        const items = calculators.filter((c) => c.category === category.key);
        return (
          <WorkspaceSection
            key={category.key}
            alt={index % 2 === 1}
            aria-labelledby={`category-${category.key}`}
          >
            <div className="space-y-3">
              <h2 id={`category-${category.key}`} className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {category.label}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((calculator) => (
                  <article key={calculator.slug} id={calculator.slug} className="scroll-mt-24">
                    <CalculatorCard calculator={calculator} />
                  </article>
                ))}
              </div>
            </div>
          </WorkspaceSection>
        );
      })}
    </PageHeader>
  );
}
