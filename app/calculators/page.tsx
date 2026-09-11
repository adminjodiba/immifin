import Link from "next/link";
import { Ds2Card } from "@/components/ds2/Ds2Card";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { Ds2SectionHeader } from "@/components/ds2/Ds2SectionHeader";
import { calculators } from "@/lib/data/calculators";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Immigration Calculators & Tools",
  description:
    "Explore IMMIFIN immigration calculators and tools for Green Card wait times, U.S. citizenship eligibility, H-1B wage levels and more.",
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
    <Ds2PublicPageShell
      eyebrow="TOOLS"
      title="Calculators"
      description="Tools to help you plan your immigration timeline, estimate taxes, and make smarter financial decisions in America."
    >
      {categories.map((category) => {
        const items = calculators.filter((c) => c.category === category.key);
        return (
          <section key={category.key} aria-labelledby={`category-${category.key}`}>
            <Ds2SectionHeader
              title={category.label}
              titleAs="h2"
              titleId={`category-${category.key}`}
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((calculator) => (
                <article key={calculator.slug} id={calculator.slug} className="scroll-mt-24">
                  <Ds2Card hover>
                    <Link
                      href={calculator.href ?? `/calculators#${calculator.slug}`}
                      className="ds2-calculator-catalog-link"
                      aria-label={`Open ${calculator.title}`}
                    >
                      <h3 className="ds2-calculator-catalog-title">{calculator.title}</h3>
                      <p className="ds2-calculator-catalog-description">{calculator.description}</p>
                    </Link>
                  </Ds2Card>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </Ds2PublicPageShell>
  );
}
