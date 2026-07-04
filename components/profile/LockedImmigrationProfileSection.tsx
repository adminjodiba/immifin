import { ProFeatureLockedState } from "@/components/subscription/ProFeatureLockedState";

/**
 * Free-tier lock for saving immigration profile data (Pro data entry / personalization).
 */
export function LockedImmigrationProfileSection() {
  return (
    <ProFeatureLockedState
      title="Available in Pro"
      continueHref="/user-profile#/account"
      continueLabel="Continue with Free Features"
      embedded
    />
  );
}
