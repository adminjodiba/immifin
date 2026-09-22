import type {
  Confidence,
  EducationLevel,
  ExperienceRange,
  SalaryPosition,
  WageLevel,
} from "@/lib/h1b/wage/estimatorDisplay.types";
import type { OfficialOccupationDisplayEnrichment } from "@/lib/h1b/occupations/officialOccupationDisplay.types";
import type { OfficialWageDisplayRecord } from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import type { GeographyOutcome } from "@/lib/h1b/geo/geographyResolution.types";

export const OFFICIAL_ESTIMATE_ALLOWED_BODY_KEYS = [
  "soc_code",
  "zip",
  "county_fips",
  "annual_salary",
  "experience",
  "education",
] as const;

export const OFFICIAL_ESTIMATE_API_MAX_BODY_BYTES = 8_192;

export const EXPERIENCE_RANGES = ["0-1", "2-3", "4-6", "7-10", "10+"] as const;
export const EDUCATION_LEVELS = ["Bachelor", "Master", "PhD", "Other"] as const;

export type OfficialEstimateRequest = {
  socCode: string;
  zip: string;
  countyFips?: string;
  annualSalary: number;
  experience: ExperienceRange;
  education: EducationLevel;
};

export type OfficialEstimateSalaryComparisonRow = {
  level: WageLevel;
  official_hourly: number | null;
  annual_wage: number;
  position: SalaryPosition;
};

export type OfficialEstimateSuccessView = {
  estimated_level: WageLevel;
  confidence: Confidence;
  location_label: string;
  used_annual_equivalent: boolean;
  salary_comparison: OfficialEstimateSalaryComparisonRow[];
  reasoning: string[];
};

export type OfficialEstimateErrorView = {
  code: "wage_not_leveled";
  message: string;
};

export type OfficialEstimateOccupationView = OfficialOccupationDisplayEnrichment & {
  soc_code: string;
  title: string;
};

export type OfficialEstimateWageView = OfficialWageDisplayRecord & {
  soc_code: string;
  occupation_title: string;
};

export type OfficialEstimateApiResponse = {
  outcome: GeographyOutcome;
  occupation: OfficialEstimateOccupationView | null;
  wage: OfficialEstimateWageView | null;
  estimate: OfficialEstimateSuccessView | null;
  estimate_error: OfficialEstimateErrorView | null;
};

export type OfficialEstimateApiErrorBody = {
  error: string;
};
