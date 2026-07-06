import type { ReactNode } from "react";
import { WorkspacePageHeader } from "@/components/layout/WorkspacePageHeader";
import { workspaceContainerClass, WorkspacePageShell } from "@/components/layout/WorkspacePageShell";

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumb?: string;
  wide?: boolean;
  pageHref?: string;
  showFavorite?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
  titleClassName?: string;
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  breadcrumb,
  wide = false,
  pageHref,
  showFavorite = true,
  icon,
  actions,
  titleClassName,
  children,
}: PageHeaderProps) {
  const containerClass = workspaceContainerClass(wide);

  return (
    <WorkspacePageShell wide={wide}>
      <div className={`${containerClass} py-4 sm:py-5`}>
        <WorkspacePageHeader
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          pageHref={pageHref}
          showFavorite={showFavorite}
          icon={icon}
          actions={actions}
          titleClassName={titleClassName}
        />
      </div>
      {children}
    </WorkspacePageShell>
  );
}
