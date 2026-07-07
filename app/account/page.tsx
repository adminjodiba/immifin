"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { AccountImmigrationProfileForm } from "@/components/profile/AccountImmigrationProfileForm";
import {
  ImmigrationProfileProvider,
  useImmigrationProfileForm,
} from "@/components/profile/ImmigrationProfileProvider";
import { DevelopmentSubscriptionPanel } from "@/components/subscription/DevelopmentSubscriptionPanel";

function AccountMigrationBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <p className="font-medium">Profile management has moved to Manage Profile.</p>
      <p className="mt-2">
        <Link href="/user-profile#/immigration" className="btn-secondary inline-flex">
          Go to Manage Profile
        </Link>
      </p>
    </div>
  );
}

function AccountPageContent() {
  const { profileEmail } = useImmigrationProfileForm();

  return (
    <>
      <AccountMigrationBanner />

      <DevelopmentSubscriptionPanel />

      {profileEmail && (
        <p className="mb-6 text-sm text-slate-600">
          Signed in as <span className="font-medium text-slate-900">{profileEmail}</span>
        </p>
      )}

      <AccountImmigrationProfileForm />
    </>
  );
}

export default function AccountPage() {
  return (
    <ContactOnboardingGuard>
      <PageHeader
        title="Account Settings"
        description="Manage your immigration defaults for calculators and bulletin tools."
      >
        <WorkspaceSection>
          <ImmigrationProfileProvider>
            <AccountPageContent />
          </ImmigrationProfileProvider>
        </WorkspaceSection>
      </PageHeader>
    </ContactOnboardingGuard>
  );
}
