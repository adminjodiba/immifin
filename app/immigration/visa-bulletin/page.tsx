import { VisaBulletinDashboard } from "@/components/VisaBulletinDashboard";
import { createMetadata } from "@/lib/metadata";
import { getVisaBulletinData, type VisaBulletinRow } from "@/lib/visaBulletinData";

export const metadata = createMetadata({
  title: "Visa Bulletin Dashboard",
  description:
    "Track the latest employment-based visa bulletin dates and monitor green card processing trends.",
  path: "/immigration/visa-bulletin",
});

export default async function ImmigrationVisaBulletinPage() {
  let rows: VisaBulletinRow[] = [];
  let error: string | null = null;

  try {
    rows = await getVisaBulletinData();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load visa bulletin data.";
  }

  return <VisaBulletinDashboard rows={rows} error={error} />;
}
