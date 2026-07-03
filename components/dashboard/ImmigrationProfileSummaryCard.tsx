import Link from "next/link";
import {
  formatBulletinTypeLabel,
  formatCategoryLabel,
  formatCountryLabel,
  formatDisplayDate,
} from "@/lib/dashboard/formatProfileLabels";
import type { ImmigrationProfile } from "@/lib/supabase/types";

type ImmigrationProfileSummaryCardProps = {
  immigrationProfile: ImmigrationProfile | null;
  hasCompleteImmigrationProfile: boolean;
};

function ProfileField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-slate-900">
        {value ?? "—"}
      </dd>
    </div>
  );
}

export function ImmigrationProfileSummaryCard({
  immigrationProfile,
  hasCompleteImmigrationProfile,
}: ImmigrationProfileSummaryCardProps) {
  if (!hasCompleteImmigrationProfile || !immigrationProfile) {
    return (
      <section className="card-static flex h-full flex-col">
        <h2 className="heading-3 text-slate-900">Immigration Profile</h2>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
          Complete your immigration profile to personalize your dashboard.
        </p>
        <Link href="/user-profile#/immigration" className="btn-primary mt-6 w-fit">
          Create / Update Profile
        </Link>
      </section>
    );
  }

  const category = formatCategoryLabel(immigrationProfile.default_category);
  const country = formatCountryLabel(immigrationProfile.default_country);
  const bulletinType = formatBulletinTypeLabel(immigrationProfile.default_bulletin_type);
  const priorityDate = formatDisplayDate(immigrationProfile.priority_date);
  const lastUpdated = formatDisplayDate(immigrationProfile.updated_at);

  return (
    <section className="card-static flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="heading-3 text-slate-900">Immigration Profile</h2>
        <Link
          href="/user-profile#/immigration"
          className="text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          Edit profile
        </Link>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <ProfileField label="Category" value={category} />
        <ProfileField label="Country of chargeability" value={country} />
        <ProfileField label="Priority date" value={priorityDate} />
        {bulletinType && <ProfileField label="Preferred bulletin type" value={bulletinType} />}
        {lastUpdated && <ProfileField label="Last updated" value={lastUpdated} />}
      </dl>
    </section>
  );
}
