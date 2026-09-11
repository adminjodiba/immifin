import type { ReactNode } from "react";
import { Ds2MyImmifinWorkspaceNav } from "@/components/ds2/Ds2MyImmifinWorkspaceNav";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

export function MyProfileWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ds2-workspace-page ds2-profile-page">
      <div className={`${landingV3ContentGridClass} ds2-workspace-page-inner ds2-profile-page-inner`}>
        <div className="ds2-profile-workspace">
          <Ds2MyImmifinWorkspaceNav active="profile" />
          <div className="ds2-profile-workspace-main">{children}</div>
        </div>
      </div>
    </div>
  );
}
