export const categoryOptions = [
  { value: "", label: "No default" },
  { value: "EB1", label: "EB1" },
  { value: "EB2", label: "EB2" },
  { value: "EB3", label: "EB3" },
] as const;

export const countryOptions = [
  { value: "", label: "No default" },
  { value: "India", label: "India" },
  { value: "China", label: "China" },
  { value: "Mexico", label: "Mexico" },
  { value: "Philippines", label: "Philippines" },
  { value: "ROW", label: "Rest of World (ROW)" },
] as const;

export const bulletinTypeOptions = [
  { value: "", label: "No default" },
  { value: "final_action", label: "Final Action Dates" },
  { value: "dates_for_filing", label: "Dates for Filing" },
] as const;

export const marriedToUsCitizenOptions = [
  { value: "false", label: "No" },
  { value: "true", label: "Yes" },
] as const;

/** Maps DB value to form value; null/undefined defaults to No ("false"). */
export function marriedToFormValue(value: boolean | null | undefined): string {
  return value === true ? "true" : "false";
}
