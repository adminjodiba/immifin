/**
 * Browser client for POST /api/h1b/official-estimate.
 * Sends only user inputs. Never sends area_code, wages, or calculated outputs.
 */

import type { OfficialOccupationDisplayMatchConfidence } from "@/lib/h1b/occupations/officialOccupationDisplay.types";
import type {
  Confidence,
  EducationLevel,
  ExperienceRange,
  SalaryPosition,
  WageLevel,
} from "@/lib/h1b/wage/estimatorDisplay.types";
import type { OfficialWageDisplayRecord } from "@/lib/h1b/wage/client/formatOfficialWageDisplay";

export type OfficialEstimateClientWage = OfficialWageDisplayRecord & {
  soc_code: string;
  occupation_title: string;
};

export type OfficialEstimateClientOccupation = {
  soc_code: string;
  title: string;
  group: string | null;
  common_job_titles: string[];
  typical_h1b: boolean;
  match_confidence: OfficialOccupationDisplayMatchConfidence | null;
};

export type OfficialEstimateClientComparisonRow = {
  level: WageLevel;
  officialHourly: number | null;
  annualWage: number;
  position: SalaryPosition;
};

export type OfficialEstimateClientSuccess = {
  ok: true;
  estimatedLevel: WageLevel;
  confidence: Confidence;
  occupation: { code: string; title: string; group: string | null };
  locationLabel: string;
  salaryComparison: OfficialEstimateClientComparisonRow[];
  reasoning: string[];
  usedAnnualEquivalent: boolean;
};

export type OfficialEstimateClientFailure = {
  ok: false;
  code: "wage_not_leveled";
  message: string;
};

export type OfficialEstimateClientResultView = OfficialEstimateClientSuccess | OfficialEstimateClientFailure;

export type OfficialEstimateClientResponse = {
  outcome: "AUTO" | "CHOICE_REQUIRED" | "UNAVAILABLE";
  occupation: OfficialEstimateClientOccupation | null;
  wage: OfficialEstimateClientWage | null;
  result: OfficialEstimateClientResultView | null;
};

export type OfficialEstimateClientResult =
  | { ok: true; data: OfficialEstimateClientResponse }
  | {
      ok: false;
      kind: "validation" | "unavailable" | "network" | "throttled";
      status?: number;
      retryAfterSeconds?: number;
    };

export const OFFICIAL_ESTIMATE_NETWORK_COPY = "Unable to look up published wages. Please try again.";
export const OFFICIAL_ESTIMATE_UNAVAILABLE_COPY =
  "Published wages are not available for this occupation and worksite.";
export const OFFICIAL_ESTIMATE_CHOICE_COPY =
  "This worksite ZIP needs a county selection before published wages can be shown.";
export const OFFICIAL_ESTIMATE_THROTTLED_COPY =
  "Too many requests. Please wait a moment and try again.";

export function officialEstimateFailureCopy(
  kind: "validation" | "unavailable" | "network" | "throttled",
): string {
  if (kind === "network") {
    return OFFICIAL_ESTIMATE_NETWORK_COPY;
  }
  if (kind === "throttled") {
    return OFFICIAL_ESTIMATE_THROTTLED_COPY;
  }
  return OFFICIAL_ESTIMATE_UNAVAILABLE_COPY;
}

export type OfficialEstimateRequestInput = {
  socCode: string;
  zip: string;
  countyFips?: string | null;
  annualSalary: number;
  experience: ExperienceRange;
  education: EducationLevel;
};

export function buildOfficialEstimateRequestBody(
  input: OfficialEstimateRequestInput,
): {
  soc_code: string;
  zip: string;
  county_fips?: string;
  annual_salary: number;
  experience: ExperienceRange;
  education: EducationLevel;
} {
  const body: {
    soc_code: string;
    zip: string;
    county_fips?: string;
    annual_salary: number;
    experience: ExperienceRange;
    education: EducationLevel;
  } = {
    soc_code: input.socCode,
    zip: input.zip,
    annual_salary: input.annualSalary,
    experience: input.experience,
    education: input.education,
  };
  if (input.countyFips) {
    body.county_fips = input.countyFips;
  }
  return body;
}

function isWageLevel(value: unknown): value is WageLevel {
  return value === "I" || value === "II" || value === "III" || value === "IV";
}

function isConfidence(value: unknown): value is Confidence {
  return value === "High" || value === "Medium" || value === "Low";
}

function isSalaryPosition(value: unknown): value is SalaryPosition {
  return value === "Above" || value === "Near" || value === "Below";
}

function isFiniteNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function parseWage(value: unknown): OfficialEstimateClientWage | null {
  if (value === null) return null;
  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.soc_code !== "string" ||
    typeof row.occupation_title !== "string" ||
    !(row.label === null || typeof row.label === "string") ||
    !isFiniteNumberOrNull(row.level1) ||
    !isFiniteNumberOrNull(row.level2) ||
    !isFiniteNumberOrNull(row.level3) ||
    !isFiniteNumberOrNull(row.level4) ||
    !isFiniteNumberOrNull(row.average)
  ) {
    return null;
  }
  return {
    soc_code: row.soc_code,
    occupation_title: row.occupation_title,
    label: row.label,
    level1: row.level1,
    level2: row.level2,
    level3: row.level3,
    level4: row.level4,
    average: row.average,
  };
}

function parseOccupation(value: unknown): OfficialEstimateClientOccupation | null {
  if (value === null) return null;
  if (typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.soc_code !== "string" || typeof row.title !== "string") return null;
  if (!(row.group === null || typeof row.group === "string")) return null;
  if (!Array.isArray(row.common_job_titles) || !row.common_job_titles.every((item) => typeof item === "string")) {
    return null;
  }
  if (typeof row.typical_h1b !== "boolean") return null;
  if (
    !(
      row.match_confidence === null ||
      row.match_confidence === "High" ||
      row.match_confidence === "Medium" ||
      row.match_confidence === "Low"
    )
  ) {
    return null;
  }
  return {
    soc_code: row.soc_code,
    title: row.title,
    group: row.group,
    common_job_titles: row.common_job_titles,
    typical_h1b: row.typical_h1b,
    match_confidence: row.match_confidence,
  };
}

function parseComparisonRow(value: unknown): OfficialEstimateClientComparisonRow | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    !isWageLevel(row.level) ||
    !isFiniteNumberOrNull(row.official_hourly) ||
    typeof row.annual_wage !== "number" ||
    !Number.isFinite(row.annual_wage) ||
    !isSalaryPosition(row.position)
  ) {
    return null;
  }
  return {
    level: row.level,
    officialHourly: row.official_hourly,
    annualWage: row.annual_wage,
    position: row.position,
  };
}

function parseEstimate(value: unknown): OfficialEstimateClientSuccess | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (
    !isWageLevel(row.estimated_level) ||
    !isConfidence(row.confidence) ||
    typeof row.location_label !== "string" ||
    typeof row.used_annual_equivalent !== "boolean" ||
    !Array.isArray(row.salary_comparison) ||
    !Array.isArray(row.reasoning) ||
    !row.reasoning.every((item) => typeof item === "string")
  ) {
    return null;
  }
  const salaryComparison = row.salary_comparison.map(parseComparisonRow);
  if (salaryComparison.some((item) => item === null)) return null;
  return {
    ok: true,
    estimatedLevel: row.estimated_level,
    confidence: row.confidence,
    occupation: { code: "", title: "", group: null },
    locationLabel: row.location_label,
    salaryComparison: salaryComparison as OfficialEstimateClientComparisonRow[],
    reasoning: row.reasoning,
    usedAnnualEquivalent: row.used_annual_equivalent,
  };
}

function parseEstimateError(value: unknown): OfficialEstimateClientFailure | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (row.code !== "wage_not_leveled" || typeof row.message !== "string") return null;
  return { ok: false, code: "wage_not_leveled", message: row.message };
}

function parseResponse(value: unknown): OfficialEstimateClientResponse | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (row.outcome !== "AUTO" && row.outcome !== "CHOICE_REQUIRED" && row.outcome !== "UNAVAILABLE") {
    return null;
  }
  const occupation = parseOccupation(row.occupation);
  if (row.occupation !== null && occupation === null) return null;
  const wage = parseWage(row.wage);
  if (row.wage !== null && wage === null) return null;

  let result: OfficialEstimateClientResultView | null = null;
  if (row.estimate !== null && row.estimate !== undefined) {
    const estimate = parseEstimate(row.estimate);
    if (!estimate) return null;
    result = {
      ...estimate,
      occupation: {
        code: occupation?.soc_code ?? wage?.soc_code ?? "",
        title: occupation?.title ?? wage?.occupation_title ?? "",
        group: occupation?.group ?? null,
      },
    };
  } else if (row.estimate_error !== null && row.estimate_error !== undefined) {
    result = parseEstimateError(row.estimate_error);
    if (!result) return null;
  }

  return {
    outcome: row.outcome,
    occupation,
    wage,
    result,
  };
}

export async function fetchOfficialEstimate(
  input: OfficialEstimateRequestInput,
): Promise<OfficialEstimateClientResult> {
  const body = buildOfficialEstimateRequestBody(input);

  let response: Response;
  try {
    response = await fetch("/api/h1b/official-estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, kind: "network" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { ok: false, kind: response.ok ? "unavailable" : "validation", status: response.status };
  }

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    return {
      ok: false,
      kind: "throttled",
      status: 429,
      retryAfterSeconds:
        Number.isInteger(retryAfter) && retryAfter > 0 ? Math.min(retryAfter, 120) : undefined,
    };
  }

  if (!response.ok) {
    return { ok: false, kind: response.status >= 500 ? "unavailable" : "validation", status: response.status };
  }

  const data = parseResponse(payload);
  if (!data) {
    return { ok: false, kind: "unavailable", status: response.status };
  }
  return { ok: true, data };
}
