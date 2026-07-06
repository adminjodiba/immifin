import type { ReactNode } from "react";
import { workspaceContainerClass } from "@/components/layout/WorkspacePageShell";

type WorkspaceSectionProps = {
  children: ReactNode;
  alt?: boolean;
  wide?: boolean;
  className?: string;
  id?: string;
  "aria-labelledby"?: string;
};

export function WorkspaceSection({
  children,
  alt = false,
  wide = false,
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
      <div className={`${workspaceContainerClass(wide)} space-y-6`}>{children}</div>
    </section>
  );
}
