import { VisaBulletinDashboard } from "@/components/VisaBulletinDashboard";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Visa Bulletin Dashboard",
  description:
    "Track the latest employment-based visa bulletin dates and monitor green card processing trends.",
  path: "/immigration/visa-bulletin",
});

export const dynamic = "force-dynamic";

export default function ImmigrationVisaBulletinPage() {
  return <VisaBulletinDashboard />;
}
