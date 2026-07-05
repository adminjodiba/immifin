import { PageHeader } from "@/components/PageHeader";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Choose your Immifin plan — start free, upgrade to Pro for automation, or Power for intelligence.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Pricing"
        title="Choose Your Immifin Plan"
        description="Start free. Upgrade when you are ready for automation and intelligence."
      />

      <PricingPlans />
    </>
  );
}
