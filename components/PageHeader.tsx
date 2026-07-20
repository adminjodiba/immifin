import type { ReactNode } from "react";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import { WorkspacePageHeader } from "@/components/layout/WorkspacePageHeader";
import { workspaceContainerClass, WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

type PageHeaderProps = {
  title: string;
  description?: string;
  wide?: boolean;
  pageHref?: string;
  showFavorite?: boolean;
  /** When true (default), shows Close → home. Home landing does not use PageHeader. */
  showClose?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  wide = false,
  pageHref,
  showFavorite = true,
  showClose = true,
  icon,
  actions,
  titleClassName,
  descriptionClassName,
  children,
}: PageHeaderProps) {
  const containerClass = workspaceContainerClass(wide);
  const resolvedActions = showClose ? (
    <>
      {actions}
      <DashboardCloseAction />
    </>
  ) : (
    actions
  );

  return (
    <WorkspacePageShell wide={wide}>
      <div className={`${containerClass} py-4 sm:py-5`}>
        <WorkspacePageHeader
          title={title}
          description={description}
          pageHref={pageHref}
          showFavorite={showFavorite}
          icon={icon}
          actions={resolvedActions}
          titleClassName={titleClassName}
          descriptionClassName={descriptionClassName}
        />
      </div>
      {children}
    </WorkspacePageShell>
  );
}
