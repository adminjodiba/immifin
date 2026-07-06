import type { ReactNode } from "react";

type WorkspacePageShellProps = {
  children: ReactNode;
  wide?: boolean;
};

export function WorkspacePageShell({ children, wide = false }: WorkspacePageShellProps) {
  return <div className="workspace-page">{children}</div>;
}

export function workspaceContainerClass(wide = false): string {
  return wide ? "container-dashboard" : "container-main";
}
