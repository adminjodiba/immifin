import { currentUser } from "@clerk/nextjs/server";
import {
  getDashboardWelcomeName,
  getOptionalUserProfileForDashboard,
} from "@/lib/dashboard/getOptionalUserProfileForDashboard";
import {
  buildEmploymentJourneyData,
  type EmploymentJourneyData,
} from "@/lib/dashboard/employmentJourney";
import {
  buildGreenCardJourneyData,
  type GreenCardJourneyData,
} from "@/lib/dashboard/journeyDates";
import { resolveJourneyStage, type JourneyStage } from "@/lib/dashboard/journeyStage";
import type { ImmigrationProfile, Profile } from "@/lib/supabase/types";

export type PersonalDashboardData = {
  welcomeName: string;
  profile: Profile | null;
  immigrationProfile: ImmigrationProfile | null;
  journeyStage: JourneyStage;
  greenCardJourney: GreenCardJourneyData | null;
  employmentJourney: EmploymentJourneyData | null;
  needsInternalProfileSetup: boolean;
  needsProfileSetup: boolean;
  hasCompleteImmigrationProfile: boolean;
};

export function hasCompleteImmigrationProfile(
  immigrationProfile: ImmigrationProfile | null,
): boolean {
  return Boolean(
    immigrationProfile?.default_category &&
      immigrationProfile.default_country &&
      immigrationProfile.priority_date,
  );
}

export async function getPersonalDashboardData(): Promise<PersonalDashboardData> {
  const [clerkUser, profileLoadResult] = await Promise.all([
    currentUser(),
    getOptionalUserProfileForDashboard(),
  ]);

  const { profile, immigrationProfile, needsInternalProfileSetup } = profileLoadResult;
  const welcomeName = getDashboardWelcomeName(clerkUser, profile);
  const journeyStage = resolveJourneyStage(immigrationProfile);

  let greenCardJourney: GreenCardJourneyData | null = null;
  let employmentJourney: EmploymentJourneyData | null = null;

  if (journeyStage === "green_card_holder" && immigrationProfile?.green_card_issue_date) {
    greenCardJourney = buildGreenCardJourneyData(
      immigrationProfile.green_card_issue_date,
      immigrationProfile.married_to_us_citizen ?? false,
    );
  }

  const hasCompleteImmigrationProfileFlag =
    !needsInternalProfileSetup && hasCompleteImmigrationProfile(immigrationProfile);

  if (
    journeyStage === "employment_gc_waiting" &&
    hasCompleteImmigrationProfileFlag &&
    immigrationProfile
  ) {
    employmentJourney = await buildEmploymentJourneyData(immigrationProfile);
  }

  const needsProfileSetup =
    needsInternalProfileSetup ||
    (journeyStage === "employment_gc_waiting" && !hasCompleteImmigrationProfileFlag);

  return {
    welcomeName,
    profile,
    immigrationProfile,
    journeyStage,
    greenCardJourney,
    employmentJourney,
    needsInternalProfileSetup,
    needsProfileSetup,
    hasCompleteImmigrationProfile: hasCompleteImmigrationProfileFlag,
  };
}
