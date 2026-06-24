import { PageHeader } from "@/components/PageHeader";
import { TopicCard } from "@/components/TopicCard";
import { CalculatorCard } from "@/components/CalculatorCard";
import { calculators } from "@/lib/data/calculators";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Insurance",
  description:
    "Insurance guides and calculators for immigrants — health, auto, renters, and life coverage in America.",
  path: "/insurance",
});

const topics = [
  {
    title: "Health Insurance",
    description: "Navigate employer plans, marketplace coverage, and immigrant eligibility.",
    icon: "🏥",
  },
  {
    title: "Auto Insurance",
    description: "Understand coverage requirements and find affordable rates as a newcomer.",
    icon: "🚗",
  },
  {
    title: "Renters Insurance",
    description: "Protect your belongings with affordable renters coverage.",
    icon: "🏠",
  },
  {
    title: "Life Insurance",
    description: "Plan for your family's financial security with the right life policy.",
    icon: "🛡️",
  },
];

export default function InsurancePage() {
  const insuranceCalculators = calculators.filter((c) => c.category === "insurance");

  return (
    <>
      <PageHeader
        breadcrumb="Insurance"
        title="Insurance Guides"
        description="Understand health, auto, renters, and life insurance options available to immigrants in the United States."
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

      <section className="section-padding section-alt" aria-labelledby="insurance-calculators">
        <div className="container-main">
          <h2 id="insurance-calculators" className="heading-2 mb-8 sm:mb-10">
            Insurance Calculators
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {insuranceCalculators.map((calculator) => (
              <CalculatorCard key={calculator.slug} calculator={calculator} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
