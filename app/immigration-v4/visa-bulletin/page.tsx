import type { Metadata } from "next";
import { VisaBulletinDashboard2 } from "@/components/VisaBulletinDashboard2";
import { VisaBulletinUnderstanding } from "@/components/VisaBulletinUnderstanding";
import { createMetadata } from "@/lib/metadata";
import {
  formatVisaBulletinMonthShort,
  getLatestVisaBulletinMonth,
} from "@/lib/visaBulletinHistory";

/**
 * V4 workspace body for Current Visa Bulletin.
 * Reuses the existing dashboard + understanding components.
 * Does not import the production page or Ds2DataPageShell.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 — Current Visa Bulletin",
  description:
    "Temporary Product Owner preview of Current Visa Bulletin inside Immigration V4. Not a public page.",
  path: "/immigration-v4/visa-bulletin",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function ImmigrationV4VisaBulletinPage() {
  const latestMonth = await getLatestVisaBulletinMonth();
  const bulletinMonthLabel = latestMonth ? formatVisaBulletinMonthShort(latestMonth) : null;

  return (
    <div className="ds2-imm-v4-body">
      <VisaBulletinDashboard2 bulletinMonthLabel={bulletinMonthLabel} href="/immigration-v4">
        <VisaBulletinUnderstanding />
      </VisaBulletinDashboard2>
    </div>
  );
}
