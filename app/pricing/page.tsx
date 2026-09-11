import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { Ds2PublicPageShell } from "@/components/ds2/Ds2PublicPageShell";
import { PricingPlans } from "@/components/pricing/PricingPlans";
import { createMetadata } from "@/lib/metadata";
import { canUseDevSubscriptionTools } from "@/lib/subscription/devSubscriptionAccess";

export const metadata = createMetadata({
  title: "Pricing",
  description:
    "Choose your Immifin plan — start free, upgrade to Pro for automation, or Power for intelligence.",
  path: "/pricing",
});

export default async function PricingPage() {
  const { userId } = await auth();
  const developmentSubscriptionModeEnabled = canUseDevSubscriptionTools(userId);

  return (
    <Ds2PublicPageShell
      eyebrow="PLANS"
      title="Choose Your Immifin Plan"
      description="Start free. Upgrade when you are ready for automation and intelligence."
    >
      <Suspense fallback={null}>
        <PricingPlans developmentSubscriptionModeEnabled={developmentSubscriptionModeEnabled} />
      </Suspense>
    </Ds2PublicPageShell>
  );
}
