/**
 * Shared class names for Visa Bulletin Final Action / Dates for Filing tab buttons.
 * Visual styles live in app/globals.css (Tailwind content does not scan lib/).
 */

export type BulletinDateTypeTabKey = "final-action" | "filing";

export function bulletinDateTypeTabClassName(
  key: BulletinDateTypeTabKey,
  options?: { compact?: boolean },
): string {
  const size = options?.compact ? "btn-bulletin-tab--compact" : "btn-bulletin-tab--comfortable";
  const variant =
    key === "final-action" ? "btn-bulletin-final-action" : "btn-bulletin-filing";
  return `btn-bulletin-tab ${size} ${variant}`;
}
