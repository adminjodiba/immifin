import { H1bWageLevelEstimator } from "@/components/H1bWageLevelEstimator";
import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "H-1B Wage Level Estimator",
  description:
    "Estimate your likely H-1B wage level using occupation, location, salary, experience, and education.",
  path: "/immigration/h1b-wage-level-estimator",
});

export default function H1bWageLevelEstimatorPage() {
  return (
    <WorkspacePageShell>
      <div className="container-main py-4 sm:py-5">
        <H1bWageLevelEstimator />
      </div>
    </WorkspacePageShell>
  );
}
