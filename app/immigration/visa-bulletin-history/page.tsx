import { VisaBulletinHistoricalTrends } from "@/components/VisaBulletinHistoricalTrends";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Visa Bulletin Historical Trends",
  description:
    "Explore archived employment-based visa bulletin cutoff dates by category, country, and date type over time.",
  path: "/immigration/visa-bulletin-history",
});

export default function VisaBulletinHistoryPage() {
  return <VisaBulletinHistoricalTrends />;
}
