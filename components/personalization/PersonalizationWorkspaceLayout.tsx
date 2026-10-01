import type { ReactNode } from "react";

export function PersonalizationWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-profile-page">
      <div className="ds2-profile-workspace-main">{children}</div>
    </div>
  );
}
