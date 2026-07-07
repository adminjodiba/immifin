import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { WorkspaceSection } from "@/components/layout/WorkspaceSection";

type ClerkAuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ClerkAuthShell({ title, description, children }: ClerkAuthShellProps) {
  return (
    <PageHeader title={title} description={description} showFavorite={false}>
      <WorkspaceSection>
        <div className="flex justify-center py-2 sm:py-4">{children}</div>
      </WorkspaceSection>
    </PageHeader>
  );
}
