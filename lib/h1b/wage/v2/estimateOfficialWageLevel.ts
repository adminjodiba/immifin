/**
 * SERVER-ONLY — recovered Production wage-level estimation.
 * Do not import from client components or browser clients.
 *
 * Recovered from e228b2e / lib/h1b/wageLevelEstimator.ts and adapted to official
 * OFLC wage records. Demo city/state tables are not used. Algorithm is frozen.
 */

import {
  ANNUAL_EQUIVALENT_HOURS,
  annualEquivalentFromHourly,
  officialWageDisplayUnit,
  type OfficialWageDisplayRecord,
} from "@/lib/h1b/wage/client/formatOfficialWageDisplay";
import type {
  Confidence,
  EducationLevel,
  ExperienceRange,
  SalaryPosition,
  WageLevel,
} from "@/lib/h1b/wage/estimatorDisplay.types";

type WageLevelThresholds = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
};

export type OfficialEstimatorInput = {
  socCode: string;
  officialTitle: string;
  annualSalary: number;
  experience: ExperienceRange;
  education: EducationLevel;
  wageAreaName: string;
  wage: OfficialWageDisplayRecord;
};

export type OfficialSalaryComparisonRow = {
  level: WageLevel;
  officialHourly: number | null;
  annualWage: number;
  usedAnnualEquivalent: boolean;
  position: SalaryPosition;
};

export type OfficialEstimatorSuccess = {
  ok: true;
  estimatedLevel: WageLevel;
  confidence: Confidence;
  occupation: { code: string; title: string };
  locationLabel: string;
  salaryComparison: OfficialSalaryComparisonRow[];
  reasoning: string[];
  usedAnnualEquivalent: boolean;
};

export type OfficialEstimatorError = {
  ok: false;
  code: "wage_not_leveled";
  message: string;
};

export type OfficialEstimatorResult = OfficialEstimatorSuccess | OfficialEstimatorError;

export const OFFICIAL_WAGE_NOT_LEVELED_COPY =
  "The official source did not publish a complete Level I–IV wage set for this record, so IMMIFIN cannot estimate a wage level.";

/** Map annual salary to prevailing wage level using level thresholds. Algorithm frozen. */
function salaryToWageLevel(salary: number, thresholds: WageLevelThresholds): WageLevel {
  if (salary < thresholds.level2) {
    return "I";
  }
  if (salary < thresholds.level3) {
    return "II";
  }
  if (salary < thresholds.level4) {
    return "III";
  }
  return "IV";
}

function salaryPosition(salary: number, levelWage: number): SalaryPosition {
  const ratio = salary / levelWage;
  if (ratio >= 1.05) {
    return "Above";
  }
  if (ratio <= 0.95) {
    return "Below";
  }
  return "Near";
}

/** Recovered from wageLevelEstimator.computeConfidence — unchanged scoring. */
export function computeConfidence(
  estimatedLevel: WageLevel,
  experience: ExperienceRange,
  education: EducationLevel,
): Confidence {
  let score = 0;
  const levelNum = { I: 1, II: 2, III: 3, IV: 4 }[estimatedLevel];

  switch (experience) {
    case "0-1":
      if (levelNum >= 3) {
        score -= 2;
      }
      break;
    case "2-3":
      if (levelNum === 2) {
        score += 1;
      } else if (levelNum >= 4) {
        score -= 1;
      }
      break;
    case "4-6":
      if (levelNum === 2 || levelNum === 3) {
        score += 1;
      }
      break;
    case "7-10":
      if (levelNum === 3) {
        score += 2;
      } else if (levelNum === 1) {
        score -= 1;
      }
      break;
    case "10+":
      if (levelNum >= 3) {
        score += 2;
      } else if (levelNum <= 2) {
        score -= 1;
      }
      break;
  }

  switch (education) {
    case "Master":
      score += 1;
      break;
    case "PhD":
      if (levelNum >= 3) {
        score += 2;
      } else {
        score += 1;
      }
      break;
    default:
      break;
  }

  if (score >= 2) {
    return "High";
  }
  if (score <= -1) {
    return "Low";
  }
  return "Medium";
}

export function officialWageToAnnualThresholds(wage: OfficialWageDisplayRecord): {
  thresholds: WageLevelThresholds;
  usedAnnualEquivalent: boolean;
  hourly: { level1: number | null; level2: number | null; level3: number | null; level4: number | null };
} | null {
  const unit = officialWageDisplayUnit(wage.label);
  if (unit === "unspecified") {
    return null;
  }

  const toAnnual = (value: number | null): number | null => {
    if (value === null) return null;
    if (unit === "hour") return annualEquivalentFromHourly(value);
    return Math.round(value);
  };

  const level1 = toAnnual(wage.level1);
  const level2 = toAnnual(wage.level2);
  const level3 = toAnnual(wage.level3);
  const level4 = toAnnual(wage.level4);
  if (level1 === null || level2 === null || level3 === null || level4 === null) {
    return null;
  }

  return {
    thresholds: { level1, level2, level3, level4 },
    usedAnnualEquivalent: unit === "hour",
    hourly: {
      level1: unit === "hour" ? wage.level1 : null,
      level2: unit === "hour" ? wage.level2 : null,
      level3: unit === "hour" ? wage.level3 : null,
      level4: unit === "hour" ? wage.level4 : null,
    },
  };
}

function buildSalaryComparison(
  salary: number,
  thresholds: WageLevelThresholds,
  hourly: { level1: number | null; level2: number | null; level3: number | null; level4: number | null },
  usedAnnualEquivalent: boolean,
): OfficialSalaryComparisonRow[] {
  const levels: Array<{ level: WageLevel; wage: number; officialHourly: number | null }> = [
    { level: "I", wage: thresholds.level1, officialHourly: hourly.level1 },
    { level: "II", wage: thresholds.level2, officialHourly: hourly.level2 },
    { level: "III", wage: thresholds.level3, officialHourly: hourly.level3 },
    { level: "IV", wage: thresholds.level4, officialHourly: hourly.level4 },
  ];

  return levels.map(({ level, wage, officialHourly }) => ({
    level,
    officialHourly,
    annualWage: wage,
    usedAnnualEquivalent,
    position: salaryPosition(salary, wage),
  }));
}

function levelLabel(level: WageLevel): string {
  return `Level ${level}`;
}

function buildReasoning(
  input: OfficialEstimatorInput,
  estimatedLevel: WageLevel,
  thresholds: WageLevelThresholds,
  confidence: Confidence,
  usedAnnualEquivalent: boolean,
): string[] {
  const bullets: string[] = [];
  const levelWage =
    estimatedLevel === "I"
      ? thresholds.level1
      : estimatedLevel === "II"
        ? thresholds.level2
        : estimatedLevel === "III"
          ? thresholds.level3
          : thresholds.level4;

  bullets.push(
    `Your salary ($${input.annualSalary.toLocaleString()}) is closest to ${levelLabel(estimatedLevel)} wage range ($${levelWage.toLocaleString()}).`,
  );

  const experienceNotes: Record<ExperienceRange, string> = {
    "0-1": "Limited experience may warrant a lower level than salary alone suggests.",
    "2-3": "Your experience range supports Level II as a likely classification.",
    "4-6": "Your experience range supports Level II or III.",
    "7-10": "Your experience range supports Level III.",
    "10+": "Your experience range supports Level III or IV.",
  };
  bullets.push(experienceNotes[input.experience]);

  if (input.education === "Master") {
    bullets.push("Master's degree slightly increases confidence for higher wage levels.");
  } else if (input.education === "PhD") {
    bullets.push("PhD strongly increases confidence for Level III/IV in many specialty roles.");
  } else if (input.education === "Bachelor") {
    bullets.push("Bachelor's degree is neutral for this estimate.");
  }

  bullets.push(
    `Based on official OFLC wages for ${input.officialTitle} (${input.socCode}) in ${input.wageAreaName}.`,
  );

  if (usedAnnualEquivalent) {
    bullets.push(
      `Annual comparison values are IMMIFIN annual equivalents using official hourly rates × ${ANNUAL_EQUIVALENT_HOURS.toLocaleString()} hours (40 × 52). They are not OFLC-published annual wages.`,
    );
  }

  if (confidence === "Low") {
    bullets.push("Confidence is reduced because experience and salary signals are mixed.");
  }

  bullets.push("This is an IMMIFIN estimate from the information you entered. It is not a DOL Prevailing Wage Determination.");

  return bullets;
}

export function estimateOfficialWageLevel(input: OfficialEstimatorInput): OfficialEstimatorResult {
  const converted = officialWageToAnnualThresholds(input.wage);
  if (!converted) {
    return {
      ok: false,
      code: "wage_not_leveled",
      message: OFFICIAL_WAGE_NOT_LEVELED_COPY,
    };
  }

  const { thresholds, usedAnnualEquivalent, hourly } = converted;
  const estimatedLevel = salaryToWageLevel(input.annualSalary, thresholds);
  const confidence = computeConfidence(estimatedLevel, input.experience, input.education);
  const salaryComparison = buildSalaryComparison(
    input.annualSalary,
    thresholds,
    hourly,
    usedAnnualEquivalent,
  );

  return {
    ok: true,
    estimatedLevel,
    confidence,
    occupation: { code: input.socCode, title: input.officialTitle },
    locationLabel: input.wageAreaName,
    salaryComparison,
    reasoning: buildReasoning(input, estimatedLevel, thresholds, confidence, usedAnnualEquivalent),
    usedAnnualEquivalent,
  };
}
