import type { ReactNode } from "react";

export function AdminDashboardWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-profile-page">
      <div className="ds2-profile-workspace-main">{children}</div>
    </div>
  );
}

/** Existing /admin page keeps this name; same My Immifin shell. */
export function AdminSettingWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminDashboardWorkspaceLayout>{children}</AdminDashboardWorkspaceLayout>;
}
