import { Suspense } from "react";
import { BillingCenter } from "@/components/billing/BillingCenter";
import { BillingCenterWorkspaceLayout } from "@/components/billing/BillingCenterWorkspaceLayout";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Billing & Plan",
  description: "Manage your IMMIFIN plan, billing details, and subscription settings.",
  path: "/account/billing",
});

export default function BillingCenterPage() {
  return (
    <ContactOnboardingGuard>
      <BillingCenterWorkspaceLayout>
        <Suspense
          fallback={
            <div className="ds2-card-static">
              <p className="text-sm text-[var(--immifin-ds2-text-muted)]">
                Loading subscription details…
              </p>
            </div>
          }
        >
          <BillingCenter />
        </Suspense>
      </BillingCenterWorkspaceLayout>
    </ContactOnboardingGuard>
  );
}
