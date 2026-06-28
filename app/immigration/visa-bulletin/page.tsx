import { VisaBulletinDashboardClient } from "@/components/VisaBulletinDashboardClient";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Visa Bulletin Dashboard",
  description:
    "Track the latest employment-based visa bulletin dates and monitor green card processing trends.",
  path: "/immigration/visa-bulletin",
});

export default function ImmigrationVisaBulletinPage() {
  return <VisaBulletinDashboardClient />;
}
