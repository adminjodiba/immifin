import { VisaBulletinMovementTracker } from "@/components/VisaBulletinMovementTracker";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Visa Bulletin Movement Tracker",
  description:
    "Compare current and previous visa bulletin dates and track employment-based green card movement.",
  path: "/immigration/visa-bulletin-movement",
});

export default function VisaBulletinMovementPage() {
  return <VisaBulletinMovementTracker />;
}
