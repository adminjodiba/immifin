import type { ReactNode } from "react";
import { Ds2MyImmifinWorkspaceShell } from "@/components/ds2/Ds2MyImmifinWorkspaceShell";

/** URL-transparent shared frame for the authenticated My IMMIFIN destinations. */
export default function MyImmifinWorkspaceLayout({ children }: { children: ReactNode }) {
  return <Ds2MyImmifinWorkspaceShell>{children}</Ds2MyImmifinWorkspaceShell>;
}