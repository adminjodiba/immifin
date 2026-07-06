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
      className="rounded-[1.25rem] border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6"
      role="status"
    >
      <h2 className="text-base font-semibold text-slate-900">
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
