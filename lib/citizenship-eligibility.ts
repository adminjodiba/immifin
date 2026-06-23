export type CitizenshipEligibilityResult = {
  eligibilityDate: Date;
  earliestFilingDate: Date;
  waitingPeriodYears: 3 | 5;
  isEligibleNow: boolean;
  canFileNow: boolean;
};

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
