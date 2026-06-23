import { PageHeader } from "@/components/PageHeader";
import { CitizenshipEligibilityCalculator } from "@/components/CitizenshipEligibilityCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Citizenship Eligibility Calculator",
  description:
    "Estimate when you may be eligible to apply for U.S. citizenship based on your green card issue date and marital status.",
  path: "/calculators/citizenship-eligibility",
});

export default function CitizenshipEligibilityPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Citizenship Eligibility Calculator"
        title="Citizenship Eligibility Calculator"
        description="Estimate when you may be eligible to apply for naturalization based on how long you have held a green card."
      />

      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <CitizenshipEligibilityCalculator />
        </div>
      </section>
    </>
  );
}
