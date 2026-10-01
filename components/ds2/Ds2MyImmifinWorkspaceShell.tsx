import type { ReactNode } from "react";
import { Ds2MyImmifinWorkspaceNav } from "@/components/ds2/Ds2MyImmifinWorkspaceNav";

/**
 * Persistent My IMMIFIN application frame.
 * Route-group children supply only their destination-specific right-side body.
 */
export function Ds2MyImmifinWorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-workspace-page ds2-myimmifin-workspace-page">
      <div className="immifin-workspace-inner ds2-workspace-page-inner ds2-myimmifin-workspace-inner">
        <div className="ds2-myimmifin-workspace">
          <Ds2MyImmifinWorkspaceNav />
          <main className="ds2-myimmifin-workspace-main">{children}</main>
        </div>
      </div>
    </div>
  );
}