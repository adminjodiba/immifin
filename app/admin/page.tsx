import { redirect } from "next/navigation";
import { AdminDatasetRefreshButton } from "@/components/admin/AdminDatasetRefreshButton";
import { AdminMonthlyImmigrationReportPreview } from "@/components/admin/AdminMonthlyImmigrationReportPreview";
import { AdminMonthlyUpdateControlCenter } from "@/components/admin/AdminMonthlyUpdateControlCenter";
import { AdminNotificationTestForm } from "@/components/admin/AdminNotificationTestForm";
import { AdminSendMonthlyImmigrationUpdateForm } from "@/components/admin/AdminSendMonthlyImmigrationUpdateForm";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import {
  DATA_FRESHNESS_STATUS_LABELS,
  formatDisplayDate,
  getDataFreshnessStatus,
  getDataRefreshCenterAlert,
  getImmifinDatasets,
  type DataFreshnessStatus,
  type ImmifinDataset,
} from "@/lib/data/dataFreshness";
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

const ALERT_STYLES: Record<
  DataFreshnessStatus,
  { container: string; icon: string }
> = {
  current: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "bg-emerald-500",
  },
  "due-soon": {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "bg-amber-500",
  },
  overdue: {
    container: "border-red-200 bg-red-50 text-red-900",
    icon: "bg-red-500",
  },
};

const STATUS_BADGE_STYLES: Record<DataFreshnessStatus, string> = {
  current: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "due-soon": "bg-amber-100 text-amber-800 ring-amber-200",
  overdue: "bg-red-100 text-red-800 ring-red-200",
};

const URGENCY_STYLES: Record<ImmifinDataset["urgency"], string> = {
  Low: "bg-slate-100 text-slate-700 ring-slate-200",
  High: "bg-brand-100 text-brand-800 ring-brand-200",
};

function FreshnessAlert({ message, status }: { message: string; status: DataFreshnessStatus }) {
  const styles = ALERT_STYLES[status];

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${styles.container}`}
      role="status"
    >
      <span
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${styles.icon}`}
        aria-hidden="true"
      />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function DatasetCard({ dataset, status }: { dataset: ImmifinDataset; status: DataFreshnessStatus }) {
  return (
    <article className="card-static space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="heading-2 text-lg text-slate-900">{dataset.name}</h3>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE_STYLES[status]}`}
          >
            {DATA_FRESHNESS_STATUS_LABELS[status]}
          </span>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${URGENCY_STYLES[dataset.urgency]}`}
          >
            Urgency: {dataset.urgency}
          </span>
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Version</dt>
          <dd className="mt-1 text-slate-900">{dataset.version}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Last updated</dt>
          <dd className="mt-1 text-slate-900">{formatDisplayDate(dataset.lastUpdated)}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Next recommended refresh</dt>
          <dd className="mt-1 text-slate-900">
            {formatDisplayDate(dataset.nextRecommendedRefresh)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Refresh frequency</dt>
          <dd className="mt-1 text-slate-900">{dataset.refreshFrequency}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          How to refresh
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{dataset.refreshHint}</p>
        {dataset.refreshSteps.length > 0 && (
          <details className="mt-3 group">
            <summary className="cursor-pointer text-xs font-medium text-brand-700 marker:content-none hover:text-brand-800 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="text-slate-400 transition-transform group-open:rotate-90"
                  aria-hidden="true"
                >
                  ▸
                </span>
                Show refresh steps
              </span>
            </summary>
            <ol className="mt-3 list-decimal space-y-1.5 border-t border-slate-200/80 pt-3 pl-5 text-xs leading-relaxed text-slate-600">
              {dataset.refreshSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </details>
        )}
        {dataset.refreshAction && (
          <div className="mt-3">
            <AdminDatasetRefreshButton
              label={dataset.refreshAction.label}
              endpoint={dataset.refreshAction.endpoint}
            />
          </div>
        )}
      </div>
    </article>
  );
}

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

  const today = new Date();
  const datasets = getImmifinDatasets(today);
  const centerAlert = getDataRefreshCenterAlert(datasets, today);

  return (
    <PageHeader
      title="IMMIFIN Admin Dashboard"
      description="Monitor dataset freshness and maintenance reminders."
      showFavorite={false}
      actions={<DashboardCloseAction />}
    >
      <WorkspaceSection>
        <div className="space-y-6">
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
          <section className="card-static space-y-5">
            <div>
              <h2 className="heading-2">Data Refresh Center</h2>
              <p className="mt-2 text-sm text-slate-600">
                Track when IMMIFIN datasets were last updated and when they should be refreshed
                next.
              </p>
            </div>

            <FreshnessAlert message={centerAlert.message} status={centerAlert.status} />

            <div className="grid gap-4 lg:grid-cols-2">
              {datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  status={getDataFreshnessStatus(dataset, today)}
                />
              ))}
            </div>

            <p className="rounded-xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 text-xs leading-relaxed text-slate-500">
              Future versions may add one-click import, upload validation, and email reminders.
            </p>
          </section>

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
      </WorkspaceSection>
    </PageHeader>
  );
}
