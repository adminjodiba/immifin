import type { ReactNode } from "react";
import { workspaceContainerClass } from "@/components/layout/WorkspacePageShell";

type WorkspaceSectionProps = {
  children: ReactNode;
  alt?: boolean;
  wide?: boolean;
  /** Use the global chrome body width instead of max-w-7xl. */
  fullWidth?: boolean;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

export function WorkspaceSection({
  children,
  alt = false,
  wide = false,
  fullWidth = false,
  className = "",
  id,
  "aria-labelledby": ariaLabelledBy,
}: WorkspaceSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`workspace-section ${alt ? "workspace-section-alt" : ""} ${className}`.trim()}
    >
      <div className={`${fullWidth ? "immifin-page-inner" : workspaceContainerClass(wide)} space-y-6`}>{children}</div>
    </section>
  );
}
