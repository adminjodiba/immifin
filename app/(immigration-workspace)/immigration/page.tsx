import { ImmigrationWorkspaceHomeBody } from "@/components/immigration/ImmigrationWorkspaceHomeBody";
import { IMMIGRATION_WORKSPACE_PRODUCTION_DESTINATIONS } from "@/components/immigration/ImmigrationWorkspaceDestinations";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Immigration",
  description:
    "Expert immigration guides for visas, green cards, OPT, citizenship, and life in America.",
  path: "/immigration",
});

export default function ImmigrationPage() {
  return <ImmigrationWorkspaceHomeBody destinations={IMMIGRATION_WORKSPACE_PRODUCTION_DESTINATIONS} />;
}
