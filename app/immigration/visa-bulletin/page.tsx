import { VisaBulletinDashboard2 } from "@/components/VisaBulletinDashboard2";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

export const metadata = createMetadata({
  title: "Visa Bulletin Dashboard",
  description:
    "Track the latest employment-based visa bulletin dates and monitor green card processing trends.",
  path: "/immigration/visa-bulletin",
});

export default async function ImmigrationVisaBulletinPage() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;

  return <VisaBulletinDashboard2 bulletinMonthLabel={bulletinMonthLabel} />;
}
