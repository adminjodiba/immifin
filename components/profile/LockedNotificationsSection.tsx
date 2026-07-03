import Link from "next/link";

/**
 * Free-tier lock for Notifications (Pro automation).
 * Profile data entry remains Free; notifications are paid automation.
 */
export function LockedNotificationsSection() {
  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="heading-2 text-lg">Notifications</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
          Pro 🔒
        </span>
      </div>

      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-5">
        <p className="text-sm font-semibold text-slate-900">Notifications are available in Pro.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Upgrade to Pro to receive Visa Bulletin alerts, Priority Date current notifications,
          N-400 reminders, and other automated updates.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          You can still enter and update your profile data on Free. Automation features unlock with
          Pro.
        </p>
        <Link href="/pricing" className="btn-primary mt-5 inline-flex">
          Upgrade to Pro
        </Link>
        <p className="mt-2 text-xs text-slate-500">
          Payments are not enabled yet. Pricing shows plans; billing will connect later.
        </p>
      </div>
    </div>
  );
}
