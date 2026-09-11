import type { ReactNode } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";

type Ds2WorkspacePageShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  titleAccessory?: ReactNode;
  actions?: ReactNode;
};

/**
 * Canonical Design System 2.0 authenticated workspace body shell.
 * Header/Footer stay in SiteShell. Framing only: no auth, profile, entitlement, or data fetching.
 */
export function Ds2WorkspacePageShell({
  children,
  eyebrow,
  title,
  description,
  icon,
  titleAccessory,
  actions,
}: Ds2WorkspacePageShellProps) {
  const hasIntro = Boolean(eyebrow || title || description || icon || titleAccessory || actions);

  return (
    <div className="ds2-workspace-page">
      <div className={`${landingV3ContentGridClass} ds2-workspace-page-inner`}>
        {hasIntro ? (
          <header className="ds2-workspace-page-intro">
            {eyebrow ? <p className="ds2-workspace-page-eyebrow">{eyebrow}</p> : null}
            <div className="ds2-workspace-page-intro-row">
              <div className="ds2-workspace-page-intro-copy">
                {title || icon || titleAccessory ? (
                  <div className="ds2-workspace-page-title-row">
                    {icon ? (
                      <span className="ds2-workspace-page-icon" aria-hidden="true">
                        {icon}
                      </span>
                    ) : null}
                    {title ? (
                      <div className="ds2-workspace-page-title-with-accessory">
                        <h1 className="ds2-workspace-page-title">{title}</h1>
                        {titleAccessory}
                      </div>
                    ) : (
                      titleAccessory
                    )}
                  </div>
                ) : null}
                {description ? <p className="ds2-workspace-page-description">{description}</p> : null}
              </div>
              {actions ? <div className="ds2-workspace-page-actions">{actions}</div> : null}
            </div>
          </header>
        ) : null}
        <div className="ds2-workspace-page-body">{children}</div>
      </div>
    </div>
  );
}
