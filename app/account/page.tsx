"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ContactOnboardingGuard } from "@/components/onboarding/ContactOnboardingGuard";
import { AccountImmigrationProfileForm } from "@/components/profile/AccountImmigrationProfileForm";
import {
  ImmigrationProfileProvider,
  useImmigrationProfileForm,
} from "@/components/profile/ImmigrationProfileProvider";

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
      <>
        <PageHeader
          breadcrumb="Account"
          title="Account Settings"
          description="Manage your immigration defaults for calculators and bulletin tools."
        />

        <section className="section-padding !pt-10 sm:!pt-16">
          <div className="container-main">
            <div className="mx-auto max-w-2xl">
              <ImmigrationProfileProvider>
                <AccountPageContent />
              </ImmigrationProfileProvider>
            </div>
          </div>
        </section>
      </>
    </ContactOnboardingGuard>
  );
}
