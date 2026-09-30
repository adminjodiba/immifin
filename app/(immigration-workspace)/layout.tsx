import type { ReactNode } from "react";
import { ImmigrationWorkspaceShell } from "@/components/immigration/ImmigrationWorkspaceShell";
import { IMMIGRATION_WORKSPACE_PRODUCTION_DESTINATIONS } from "@/components/immigration/ImmigrationWorkspaceDestinations";

export default function ImmigrationWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <ImmigrationWorkspaceShell destinations={IMMIGRATION_WORKSPACE_PRODUCTION_DESTINATIONS}>
      {children}
    </ImmigrationWorkspaceShell>
  );
}