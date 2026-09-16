import { redirect } from "next/navigation";
import { AdminDataRefreshCenter } from "@/components/admin/AdminDataRefreshCenter";
import { AdminMonthlyImmigrationReportPreview } from "@/components/admin/AdminMonthlyImmigrationReportPreview";
import { AdminMonthlyUpdateControlCenter } from "@/components/admin/AdminMonthlyUpdateControlCenter";
import { AdminNotificationTestForm } from "@/components/admin/AdminNotificationTestForm";
import { AdminSendMonthlyImmigrationUpdateForm } from "@/components/admin/AdminSendMonthlyImmigrationUpdateForm";
import { AdminSettingWorkspaceLayout } from "@/components/admin/AdminSettingWorkspaceLayout";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Admin Dashboard",
  description: "Internal IMMIFIN admin dashboard for monitoring dataset freshness.",
  path: "/admin",
});

const FUTURE_MAINTENANCE_ITEMS = [
  "Email reminder notifications",
  "DOL wage import button",
  "Lottery assumptions editor",
  "Cloudflare cron refresh",
  "Visa Bulletin refresh logs",
] as const;

export default async function AdminDashboardPage() {
  try {
    await requireAdmin();
  } catch (error: unknown) {
    if (isAuthError(error)) {
      if (error.status === 401) {
        redirect("/login");
      }

      redirect("/");
    }

    throw error;
  }

  return (
    <AdminSettingWorkspaceLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">
            IMMIFIN Admin Dashboard
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
            Monitor dataset freshness and maintenance reminders.
          </p>
        </header>
        <div
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-800"
          role="status"
        >
          <p className="text-sm font-semibold">Admin-only workspace</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Signed-in users with the admin role can access this page. Sensitive import actions
            will be added here in later phases.
          </p>
        </div>

        <AdminDataRefreshCenter />

        <AdminMonthlyUpdateControlCenter />

        <AdminSendMonthlyImmigrationUpdateForm />

        {process.env.NODE_ENV === "development" ? (
          <>
            <AdminNotificationTestForm />
            <AdminMonthlyImmigrationReportPreview />
          </>
        ) : null}

        <section className="card-static space-y-4">
          <div>
            <h2 className="heading-2">Future Maintenance</h2>
            <p className="mt-2 text-sm text-slate-600">Planned admin capabilities.</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            {FUTURE_MAINTENANCE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminSettingWorkspaceLayout>
  );
}
