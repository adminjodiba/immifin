import type { ReactNode } from "react";
import { Ds2MyImmifinWorkspaceNav } from "@/components/ds2/Ds2MyImmifinWorkspaceNav";
import type { AdminDashboardSectionId } from "@/lib/admin/admin-dashboard-nav";

export function AdminDashboardWorkspaceLayout({
  children,
  adminSection,
}: {
  children: ReactNode;
  adminSection?: AdminDashboardSectionId;
}) {
  return (
    <div className="ds2-workspace-page ds2-profile-page">
      <div className="immifin-workspace-inner ds2-workspace-page-inner ds2-profile-page-inner">
        <div className="ds2-profile-workspace">
          <Ds2MyImmifinWorkspaceNav active="admin" adminSection={adminSection} />
          <div className="ds2-profile-workspace-main">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** Existing /admin page keeps this name; same My Immifin shell. */
export function AdminSettingWorkspaceLayout({
  children,
  adminSection,
}: {
  children: ReactNode;
  adminSection?: AdminDashboardSectionId;
}) {
  return (
    <AdminDashboardWorkspaceLayout adminSection={adminSection}>{children}</AdminDashboardWorkspaceLayout>
  );
}
