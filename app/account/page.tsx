"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { AccountImmigrationProfileForm } from "@/components/profile/AccountImmigrationProfileForm";
import {
  ImmigrationProfileProvider,
  useImmigrationProfileForm,
} from "@/components/profile/ImmigrationProfileProvider";

function AccountMigrationBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
      <p className="font-medium">Immigration details now live in Manage Profile.</p>
      <p className="mt-1 text-brand-800">
        Use the Immigration and Green Card tabs on{" "}
        <Link href="/user-profile" className="font-semibold underline underline-offset-2">
          Manage Profile
        </Link>{" "}
        for the unified experience. This page remains available during migration.
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
  );
}
