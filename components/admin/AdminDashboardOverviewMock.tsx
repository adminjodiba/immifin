import Link from "next/link";
import {
  ADMIN_DASHBOARD_NAV_LABEL,
  ADMIN_DASHBOARD_SECTIONS,
} from "@/lib/admin/admin-dashboard-nav";
import {
  DATA_FRESHNESS_STATUS_LABELS,
  formatDisplayDate,
  getDataFreshnessStatus,
  getDataRefreshCenterAlert,
  getImmifinDatasets,
} from "@/lib/data/dataFreshness";

const QUICK_ACTIONS = [
  {
    id: "users",
    title: "Manage Users",
    description: "View, edit, and manage user accounts.",
  },
  {
    id: "feedback",
    title: "Review Feedback",
    description: "Read and respond to user feedback.",
  },
  {
    id: "data-refresh",
    title: "Refresh Data",
    description: "Update immigration and wage datasets.",
  },
  {
    id: "notifications",
    title: "Send Notification",
    description: "Publish updates to users.",
  },
] as const;

const SYSTEM_STATUS_PLACEHOLDERS = [
  { id: "notification-service", name: "Notification service", value: "Coming later" },
  { id: "payment-processing", name: "Payment processing", value: "Coming later" },
] as const;

function formatStatusDate(today: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(today);
}

export function AdminDashboardOverviewMock() {
  const today = new Date();
  const datasets = getImmifinDatasets(today);
  const centerAlert = getDataRefreshCenterAlert(datasets, today);
  const currentCount = datasets.filter(
    (dataset) => getDataFreshnessStatus(dataset, today) === "current",
  ).length;
  const overview = ADMIN_DASHBOARD_SECTIONS[0];
  const statusDatasets = datasets.filter((dataset) =>
    ["occupation", "dol-prevailing-wage", "visa-bulletin"].includes(dataset.id),
  );

  return (
    <div className="ds2-admin-overview">
      <nav className="ds2-admin-overview-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>My Immifin</li>
          <li>
            <span aria-hidden="true">/</span>
            {ADMIN_DASHBOARD_NAV_LABEL}
          </li>
          <li>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{overview.label}</span>
          </li>
        </ol>
      </nav>

      <header className="ds2-admin-overview-header">
        <div>
          <h1 className="ds2-admin-overview-title">{ADMIN_DASHBOARD_NAV_LABEL}</h1>
          <p className="ds2-admin-overview-description">{overview.description}</p>
        </div>
        <div className="ds2-admin-overview-status">
          <p className="ds2-admin-overview-date">{formatStatusDate(today)}</p>
          <p className="ds2-admin-overview-status-label">{centerAlert.message}</p>
        </div>
      </header>

      <section className="ds2-admin-overview-metrics" aria-label="Summary">
        <article className="ds2-admin-overview-metric">
          <p className="ds2-admin-overview-metric-label">Total Users</p>
          <p className="ds2-admin-overview-metric-value">—</p>
          <p className="ds2-admin-overview-metric-note">Not available</p>
        </article>
        <article className="ds2-admin-overview-metric">
          <p className="ds2-admin-overview-metric-label">Active Users</p>
          <p className="ds2-admin-overview-metric-value">—</p>
          <p className="ds2-admin-overview-metric-note">Not available</p>
        </article>
        <article className="ds2-admin-overview-metric">
          <p className="ds2-admin-overview-metric-label">Open Feedback</p>
          <p className="ds2-admin-overview-metric-value">—</p>
          <p className="ds2-admin-overview-metric-note">Not available</p>
        </article>
        <article className="ds2-admin-overview-metric">
          <p className="ds2-admin-overview-metric-label">Datasets</p>
          <p className="ds2-admin-overview-metric-value">{datasets.length}</p>
          <p className="ds2-admin-overview-metric-note">
            {currentCount} current · from Data Refresh catalog
          </p>
        </article>
      </section>

      <section className="ds2-admin-overview-card" aria-labelledby="admin-quick-actions-heading">
        <div className="ds2-admin-overview-card-head">
          <div>
            <h2 id="admin-quick-actions-heading" className="ds2-admin-overview-card-title">
              Quick Actions
            </h2>
            <p className="ds2-admin-overview-card-copy">Common administrative tasks.</p>
          </div>
          <Link href="/admin" className="ds2-admin-overview-card-link">
            Go to current admin tools
          </Link>
        </div>
        <div className="ds2-admin-overview-actions">
          {QUICK_ACTIONS.map((action) => {
            const section = ADMIN_DASHBOARD_SECTIONS.find((item) => item.id === action.id);
            return (
              <Link key={action.id} href={section?.href ?? "/admin/overview"} className="ds2-admin-overview-action">
                <span className="ds2-admin-overview-action-title">{action.title}</span>
                <span className="ds2-admin-overview-action-copy">{action.description}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="ds2-admin-overview-split">
        <section className="ds2-admin-overview-card" aria-labelledby="admin-recent-activity-heading">
          <div className="ds2-admin-overview-card-head">
            <div>
              <h2 id="admin-recent-activity-heading" className="ds2-admin-overview-card-title">
                Recent User Activity
              </h2>
              <p className="ds2-admin-overview-card-copy">Latest sign ups and activity across the platform.</p>
            </div>
          </div>
          <p className="ds2-admin-overview-empty">No data · Coming later</p>
        </section>

        <section className="ds2-admin-overview-card" aria-labelledby="admin-system-status-heading">
          <div className="ds2-admin-overview-card-head">
            <div>
              <h2 id="admin-system-status-heading" className="ds2-admin-overview-card-title">
                System Status
              </h2>
              <p className="ds2-admin-overview-card-copy">Key data sources and services.</p>
            </div>
          </div>
          <ul className="ds2-admin-overview-status-list">
            {statusDatasets.map((dataset) => {
              const status = getDataFreshnessStatus(dataset, today);
              return (
                <li key={dataset.id}>
                  <span>{dataset.name}</span>
                  <span>
                    {DATA_FRESHNESS_STATUS_LABELS[status]}
                    <em>Updated {formatDisplayDate(dataset.lastUpdated)}</em>
                  </span>
                </li>
              );
            })}
            {SYSTEM_STATUS_PLACEHOLDERS.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
