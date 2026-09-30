import { ImmigrationWorkspaceHomeBody } from "@/components/immigration/ImmigrationWorkspaceHomeBody";
import { IMMIGRATION_WORKSPACE_PROTOTYPE_DESTINATIONS } from "@/components/immigration/ImmigrationWorkspaceDestinations";

/**
 * Immigration V4 Home — body only. Persistent frame lives in layout.tsx.
 */
export default function ImmigrationV4HomePage() {
  return <ImmigrationWorkspaceHomeBody destinations={IMMIGRATION_WORKSPACE_PROTOTYPE_DESTINATIONS} />;
}
