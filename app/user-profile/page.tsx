import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";
import { PageHeader } from "@/components/PageHeader";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { emailOnlyUserProfileElements } from "@/lib/clerk/emailOnly";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Manage Profile",
  description: "Manage your Immifin account, security settings, and profile details.",
  path: "/user-profile",
});

const userProfileAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: "w-full",
    card: "rounded-2xl border border-slate-200 bg-white shadow-sm",
    navbar: "rounded-t-2xl border-b border-slate-200",
    pageScrollBox: "rounded-b-2xl",
    ...emailOnlyUserProfileElements,
  },
};

export default function ManageProfilePage() {
  return (
    <>
      <PageHeader
        breadcrumb="Profile"
        title="Manage Profile"
        description="Update your account details, security settings, and immigration preferences."
      />

      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="min-w-0">
              <UserProfile routing="hash" appearance={userProfileAppearance}>
                <UserProfile.Page label="account" />
                <UserProfile.Page label="security" />
              </UserProfile>
            </div>

            <aside className="card-static space-y-4 lg:sticky lg:top-24">
              <div>
                <h2 className="heading-2 text-lg">Immigration Details</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Employment-based category, country of chargeability, priority date, and calculator
                  defaults are managed in your IMMIFIN immigration profile.
                </p>
              </div>
              <Link href="/account" className="btn-primary inline-flex w-full justify-center">
                Open Immigration Details
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
