import {
  AdminDataRefreshCenter,
  DataRefreshTitleStatus,
} from "@/components/admin/AdminDataRefreshCenter";
import {
  ADMIN_DASHBOARD_NAV_LABEL,
  getAdminDashboardSection,
} from "@/lib/admin/admin-dashboard-nav";
import { getDataRefreshCenterAlert, getImmifinDatasets } from "@/lib/data/dataFreshness";

export function AdminDashboardDataRefreshPane() {
  const section = getAdminDashboardSection("data-refresh");
  const today = new Date();
  const centerAlert = getDataRefreshCenterAlert(getImmifinDatasets(today), today);

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
            <span aria-current="page">{section.label}</span>
          </li>
        </ol>
      </nav>
      <header className="ds2-admin-overview-header">
        <div>
          <h1 className="ds2-admin-overview-title ds2-drc-page-title">
            <span className="ds2-drc-page-icon" aria-hidden="true">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <ellipse cx="12" cy="6" rx="7" ry="2.6" />
                <path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" />
              </svg>
            </span>
            <span className="ds2-drc-page-title-text">
              {section.label}{" "}
              <DataRefreshTitleStatus message={centerAlert.message} status={centerAlert.status} />
            </span>
          </h1>
          <p className="ds2-admin-overview-description ds2-drc-lede">
            Refresh datasets from official sources to ensure accurate and reliable information for all users.
          </p>
        </div>
      </header>
      <AdminDataRefreshCenter showHeading={false} />
    </div>
  );
}
