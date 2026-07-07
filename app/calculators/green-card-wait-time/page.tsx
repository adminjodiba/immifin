import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { GreenCardWaitTimeCalculator } from "@/components/GreenCardWaitTimeCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Green Card Calculator",
  description:
    "Check how your priority date compares to the latest visa bulletin cutoffs by employment category and country.",
  path: "/calculators/green-card-wait-time",
});

export default function GreenCardWaitTimePage() {
  return (
    <WorkspacePageShell>
      <div className="container-main py-4 sm:py-5">
        <GreenCardWaitTimeCalculator />
      </div>
    </WorkspacePageShell>
  );
}
