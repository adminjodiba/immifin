import { PageHeader } from "@/components/PageHeader";
import { GreenCardWaitTimeCalculator } from "@/components/GreenCardWaitTimeCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Green Card Wait Time Calculator",
  description:
    "Check how your priority date compares to the latest visa bulletin cutoffs by employment category and country.",
  path: "/calculators/green-card-wait-time",
});

export default function GreenCardWaitTimePage() {
  return (
    <>
      <PageHeader
        breadcrumb="Green Card Wait Time Calculator"
        title="Green Card Wait Time Calculator"
        description="See whether your priority date is current, eligible, or still waiting based on the latest visa bulletin."
      />

      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <GreenCardWaitTimeCalculator />
        </div>
      </section>
    </>
  );
}
