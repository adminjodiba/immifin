import { Ds2DataPageShell } from "@/components/ds2/Ds2DataPageShell";
import { VisaBulletinDashboard2 } from "@/components/VisaBulletinDashboard2";
import { VisaBulletinUnderstanding } from "@/components/VisaBulletinUnderstanding";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

export const metadata = {
  ...createMetadata({
    title: "Current Visa Bulletin",
    description:
      "View the current employment-based Visa Bulletin Dashboard, including Final Action Dates and Dates for Filing.",
    path: "/immigration/visa-bulletin",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default async function ImmigrationVisaBulletinPage() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;

  return (
    <Ds2DataPageShell>
      <VisaBulletinDashboard2 bulletinMonthLabel={bulletinMonthLabel}>
        <VisaBulletinUnderstanding />
      </VisaBulletinDashboard2>
    </Ds2DataPageShell>
  );
}
