import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { GreenCardWaitTimeCalculator } from "@/components/GreenCardWaitTimeCalculator";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Green Card Wait Time Calculator",
  description:
    "Estimate your employment-based Green Card wait by comparing your priority date with a Visa Bulletin cutoff date.",
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
