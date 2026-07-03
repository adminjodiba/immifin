import Link from "next/link";
import { formatCategoryLabel, formatCountryLabel, formatDisplayDate } from "@/lib/dashboard/formatProfileLabels";
import type { EmploymentJourneyData } from "@/lib/dashboard/employmentJourney";
import type { GreenCardJourneyData } from "@/lib/dashboard/journeyDates";
import type { ImmigrationProfile } from "@/lib/supabase/types";

type ProfileFieldProps = {
  label: string;
  value: string | null;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value ?? "—"}</dd>
    </div>
  );
}

type EmploymentYourJourneyProps = {
  variant: "employment";
  immigrationProfile: ImmigrationProfile;
  journey: EmploymentJourneyData;
};

type GreenCardYourJourneyProps = {
  variant: "green_card";
  journey: GreenCardJourneyData;
};

type YourJourneySidebarCardProps = EmploymentYourJourneyProps | GreenCardYourJourneyProps;

function EmploymentYourJourneyContent({
  immigrationProfile,
  journey,
}: Omit<EmploymentYourJourneyProps, "variant">) {
  return (
    <dl className="mt-5 space-y-4">
      <ProfileField label="Stage" value="Employment-Based Green Card" />
      <ProfileField
        label="Category"
        value={formatCategoryLabel(immigrationProfile.default_category)}
      />
      <ProfileField
        label="Country"
        value={formatCountryLabel(immigrationProfile.default_country)}
      />
      <ProfileField label="Priority Date" value={journey.priorityDateFormatted} />
      {journey.preferredBulletinTypeLabel ? (
        <ProfileField label="Preferred Bulletin Type" value={journey.preferredBulletinTypeLabel} />
      ) : null}
      <ProfileField label="Current Visa Bulletin" value={journey.bulletinMonthLabel} />
      {immigrationProfile.updated_at ? (
        <ProfileField
          label="Last Updated"
          value={formatDisplayDate(immigrationProfile.updated_at)}
        />
      ) : null}
    </dl>
  );
}

function GreenCardYourJourneyContent({ journey }: Omit<GreenCardYourJourneyProps, "variant">) {
  return (
    <dl className="mt-5 space-y-4">
      <ProfileField label="Stage" value="Permanent Resident" />
      <ProfileField label="Green Card Since" value={journey.greenCardIssueDateFormatted} />
      <ProfileField label="Years as Permanent Resident" value={journey.yearsAsPermanentResident} />
      <ProfileField
        label="Earliest N-400 Filing Date"
        value={journey.earliestFilingDateFormatted}
      />
      <ProfileField label="Eligibility Status" value={journey.eligibilityStatusLabel} />
    </dl>
  );
}

export function YourJourneySidebarCard(props: YourJourneySidebarCardProps) {
  const editHref =
    props.variant === "employment" ? "/user-profile#/immigration" : "/user-profile#/immigration";

  return (
    <section className="card-static">
      <div className="flex items-start justify-between gap-3">
        <h2 className="heading-3 text-slate-900">Your Journey</h2>
        <Link
          href={editHref}
          className="text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Edit Profile
        </Link>
      </div>

      {props.variant === "employment" ? (
        <EmploymentYourJourneyContent
          immigrationProfile={props.immigrationProfile}
          journey={props.journey}
        />
      ) : (
        <GreenCardYourJourneyContent journey={props.journey} />
      )}
    </section>
  );
}
