import {
  ADMIN_DASHBOARD_NAV_LABEL,
  getAdminDashboardSection,
  type AdminDashboardSectionId,
} from "@/lib/admin/admin-dashboard-nav";

export function AdminDashboardPlaceholder({
  sectionId,
}: {
  sectionId: Exclude<AdminDashboardSectionId, "overview" | "data-refresh" | "feedback">;
}) {
  const section = getAdminDashboardSection(sectionId);

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
          <h1 className="ds2-admin-overview-title">{section.label}</h1>
          <p className="ds2-admin-overview-description">{section.description}</p>
        </div>
      </header>
      <section className="ds2-admin-overview-card">
        <p className="ds2-admin-overview-empty">Coming later</p>
      </section>
    </div>
  );
}
