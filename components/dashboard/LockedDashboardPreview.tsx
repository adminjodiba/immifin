import { ProFeatureLockedState } from "@/components/subscription/ProFeatureLockedState";

export function LockedDashboardPreview() {
  return (
    <ProFeatureLockedState
      title="Available in Pro"
      continueHref="/calculators"
      continueLabel="Continue with Free Features"
    />
  );
}
