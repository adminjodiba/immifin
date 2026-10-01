import type { ReactNode } from "react";

export function MyProfileWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-profile-page">
      <div className="ds2-profile-workspace-main">{children}</div>
    </div>
  );
}
