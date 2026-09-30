import type { ReactNode } from "react";
import type { Metadata } from "next";
import { ImmigrationWorkspaceShell } from "@/components/immigration/ImmigrationWorkspaceShell";
import { IMMIGRATION_WORKSPACE_PROTOTYPE_DESTINATIONS } from "@/components/immigration/ImmigrationWorkspaceDestinations";
import { createMetadata } from "@/lib/metadata";

/**
 * Immigration V4 workspace frame — persistent hero + sidebar.
 * Only {children} (the body slot) changes per route. Do not edit V2 or V3.
 */
const previewMetadata = createMetadata({
  title: "Immigration V4 Preview",
  description:
    "Temporary Product Owner preview of Immigration V4. Not a public page.",
  path: "/immigration-v4",
});

export const metadata: Metadata = {
  ...previewMetadata,
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function ImmigrationV4Layout({ children }: { children: ReactNode }) {
  return <ImmigrationWorkspaceShell destinations={IMMIGRATION_WORKSPACE_PROTOTYPE_DESTINATIONS}>{children}</ImmigrationWorkspaceShell>;
}
