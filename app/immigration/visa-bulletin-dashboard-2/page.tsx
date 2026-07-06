import { VisaBulletinDashboard2 } from "@/components/VisaBulletinDashboard2";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

export const metadata = createMetadata({
  title: "Visa Bulletin Dashboard 2",
  description:
    "Sprint 5 Design System 2.0 mock — live employment-based visa bulletin cutoff dates.",
  path: "/immigration/visa-bulletin-dashboard-2",
});

export default async function VisaBulletinDashboard2Page() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;

  return <VisaBulletinDashboard2 bulletinMonthLabel={bulletinMonthLabel} />;
}
