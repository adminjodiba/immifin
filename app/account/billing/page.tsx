import { Suspense } from "react";
import { BillingCenter } from "@/components/billing/BillingCenter";
import { workspaceContainerClass, WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Subscription & Billing",
  description: "Manage your IMMIFIN subscription, renewals, and supported plan changes.",
  path: "/account/billing",
});

export default function BillingCenterPage() {
  return (
    <ContactOnboardingGuard>
      <WorkspacePageShell>
        <div className={`${workspaceContainerClass()} space-y-3 py-4 sm:py-5`}>
          <Suspense
            fallback={
              <div className="card-static">
                <p className="text-sm text-slate-600">Loading subscription details…</p>
              </div>
            }
          >
            <BillingCenter />
          </Suspense>
        </div>
      </WorkspacePageShell>
    </ContactOnboardingGuard>
  );
}
