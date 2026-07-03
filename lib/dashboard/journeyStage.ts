import type { ImmigrationProfile } from "@/lib/supabase/types";

export type JourneyStage = "employment_gc_waiting" | "green_card_holder" | "citizen_future";

export function hasValidGreenCardDate(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function resolveJourneyStage(
  immigrationProfile: ImmigrationProfile | null,
): JourneyStage {
  if (hasValidGreenCardDate(immigrationProfile?.green_card_issue_date)) {
    return "green_card_holder";
  }

  return "employment_gc_waiting";
}
