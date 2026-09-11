import Link from "next/link";

type DashboardProfileSetupBannerProps = {
  needsInternalProfileSetup: boolean;
};

export function DashboardProfileSetupBanner({
  needsInternalProfileSetup,
}: DashboardProfileSetupBannerProps) {
  if (!needsInternalProfileSetup) {
    return null;
  }

  return (
    <section
      className="ds2-card-static border-[color-mix(in_srgb,var(--immifin-ds2-gold)_40%,var(--immifin-ds2-border))]"
      role="status"
    >
      <h2 className="ds2-workspace-heading">
        Complete your profile to personalize your dashboard.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        We could not load your IMMIFIN account details yet. Set up your contact
        information and immigration profile to unlock your personalized summary.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/user-profile" className="btn-primary">
          Set up profile
        </Link>
        <Link href="/user-profile#/immigration" className="btn-secondary">
          Add immigration details
        </Link>
      </div>
    </section>
  );
}
