import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { createMetadata } from "@/lib/metadata";
import { isDevelopmentSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Choose your Immifin plan — start free, upgrade to Pro for automation, or Power for intelligence.",
  path: "/pricing",
});

export default function PricingPage() {
  const developmentSubscriptionModeEnabled = isDevelopmentSubscriptionModeEnabled();

  return (
    <PageHeader
      title="Choose Your Immifin Plan"
      description="Start free. Upgrade when you are ready for automation and intelligence."
      pageHref="/pricing"
    >
      <Suspense fallback={null}>
        <PricingPlans developmentSubscriptionModeEnabled={developmentSubscriptionModeEnabled} />
      </Suspense>
    </PageHeader>
  );
}
