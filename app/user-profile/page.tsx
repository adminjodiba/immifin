import { PageHeader } from "@/components/PageHeader";
import { UserProfileHub } from "@/components/profile/UserProfileHub";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Manage Profile",
  description: "Manage your Immifin account, security settings, and profile details.",
  path: "/user-profile",
});

export default function ManageProfilePage() {
  return (
    <>
      <PageHeader
        breadcrumb="Profile"
        title="Manage Profile"
        description="Update your Clerk account details, security settings, and IMMIFIN immigration planning fields."
      />

      <section className="section-padding !pt-10 sm:!pt-16">
        <div className="container-main">
          <div className="mx-auto max-w-5xl min-w-0">
            <UserProfileHub />
          </div>
        </div>
      </section>
    </>
  );
}
