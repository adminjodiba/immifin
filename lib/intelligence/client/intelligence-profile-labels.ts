/**

 * User-facing labels for profile readiness blocking reasons.

 * Hides raw internal field / enum names from the composer UI when possible.

 */



const LABELS: Record<string, string> = {

  category: "Immigration category",

  priorityDate: "Priority date",

  country: "Country of chargeability",

  greenCardIssueDate: "Green card issue date",

  default_category: "Immigration category",

  priority_date: "Priority date",

  default_country: "Country of chargeability",

  green_card_issue_date: "Green card issue date",

};



/**

 * Map an API blocking reason to a safe label.

 * Never surfaces SCREAMING_SNAKE codes or dotted internal identifiers as primary copy.

 */

export function formatIntelligenceBlockingReason(reason: string): string {

  const trimmed = reason.trim();

  if (!trimmed) {

    return "Additional profile details";

  }

  if (LABELS[trimmed]) {

    return LABELS[trimmed];

  }

  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed) || trimmed.includes(".")) {

    return "Additional profile details";

  }

  const softened = trimmed.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (!softened) {

    return "Additional profile details";

  }

  return softened.charAt(0).toUpperCase() + softened.slice(1);

}


