import { AdminNotifyIndividualUser } from "@/components/admin/AdminNotifyIndividualUser";
import { AdminNotifyUserGroup } from "@/components/admin/AdminNotifyUserGroup";
import { ADMIN_DASHBOARD_NAV_LABEL } from "@/lib/admin/admin-dashboard-nav";

export function AdminDashboardNotificationsPane() {
  return (
    <div className="ds2-admin-overview ds2-admin-notify">
      <nav className="ds2-admin-overview-breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li>My Immifin</li>
          <li>
            <span aria-hidden="true">/</span>
            {ADMIN_DASHBOARD_NAV_LABEL}
          </li>
          <li>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Notifications</span>
          </li>
        </ol>
      </nav>

      <header className="ds2-admin-overview-header">
        <div>
          <h1 className="ds2-admin-overview-title ds2-admin-notify-title">
            <span className="ds2-drc-page-icon" aria-hidden="true">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8 3.6 13.2c-.5.16-.5.86 0 1.02L9 16l1.8 5.4c.16.5.86.5 1.02 0L21 8Z" />
              </svg>
            </span>
            <span>Notifications</span>
          </h1>
          <p className="ds2-admin-overview-description">
            Generate, preview, and manage IMMIFIN member communications.
          </p>
        </div>
      </header>

      <AdminNotifyUserGroup />
      <AdminNotifyIndividualUser />
    </div>
  );
}
