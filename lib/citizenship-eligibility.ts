export type CitizenshipEligibilityResult = {
  eligibilityDate: Date;
  earliestFilingDate: Date;
  waitingPeriodYears: 3 | 5;
  isEligibleNow: boolean;
  canFileNow: boolean;
};

export type EligibilityStatus = "eligible" | "eligible_to_file" | "not_yet_eligible";

export type EligibilityStatusInfo = {
  status: EligibilityStatus;
  label: string;
  description: string;
};

export function getEligibilityStatus(result: CitizenshipEligibilityResult): EligibilityStatusInfo {
  if (result.isEligibleNow) {
    return {
      status: "eligible",
      label: "Eligible",
      description:
        "You have met the continuous residence period and may be eligible to apply for naturalization.",
    };
  }

  if (result.canFileNow) {
    return {
      status: "eligible_to_file",
      label: "Eligible to file early",
      description:
        "You are within the 90-day early filing window and may be able to submit Form N-400 now.",
    };
  }

  return {
    status: "not_yet_eligible",
    label: "Not yet eligible",
    description:
      "You have not yet reached the earliest date to file. Check back as your timeline approaches.",
  };
}

export function calculateCitizenshipEligibility(
  greenCardIssueDate: string,
  marriedToUSCitizen: boolean,
): CitizenshipEligibilityResult | null {
  if (!greenCardIssueDate) {
    return null;
  }

  const issueDate = new Date(`${greenCardIssueDate}T00:00:00`);
  if (Number.isNaN(issueDate.getTime())) {
    return null;
  }

  const waitingPeriodYears = marriedToUSCitizen ? 3 : 5;
  const eligibilityDate = new Date(issueDate);
  eligibilityDate.setFullYear(eligibilityDate.getFullYear() + waitingPeriodYears);

  const earliestFilingDate = new Date(eligibilityDate);
  earliestFilingDate.setDate(earliestFilingDate.getDate() - 90);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    eligibilityDate,
    earliestFilingDate,
    waitingPeriodYears,
    isEligibleNow: eligibilityDate <= today,
    canFileNow: earliestFilingDate <= today,
  };
}

export function formatEligibilityDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
