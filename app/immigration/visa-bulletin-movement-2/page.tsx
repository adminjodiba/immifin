import { redirect } from "next/navigation";

/**
 * Former Movement Tracker sandbox. UX promoted to production 2026-07-14.
 * @see docs/design-system/VISA_BULLETIN_MOVEMENT_TRACKER_UX_UPDATE_2026-07.md
 */
export default function VisaBulletinMovementTrackerSandboxRedirectPage() {
  redirect("/immigration/visa-bulletin-movement");
}
