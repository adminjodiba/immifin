/**
 * H-1B Wage Level Estimator — rules-based MVP (demo data only).
 * Logic is isolated here so it can be swapped for DOL/FLAG data later.
 */

import { getOccupationByCode, type SocOccupationEntry } from "@/lib/services/occupationService";

export type ExperienceRange = "0-1" | "2-3" | "4-6" | "7-10" | "10+";
export type EducationLevel = "Bachelor" | "Master" | "PhD" | "Other";
export type WageLevel = "I" | "II" | "III" | "IV";
export type Confidence = "Low" | "Medium" | "High";
export type SalaryPosition = "Above" | "Near" | "Below";

export type WageLevelThresholds = {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
};

export type SocOccupation = {
  code: string;
  title: string;
};

export type EstimatorInput = {
  socCode: string;
  workCity: string;
  state: string;
  annualSalary: number;
  experience: ExperienceRange;
  education: EducationLevel;
};

export type SalaryComparisonRow = {
  level: WageLevel;
  annualWage: number;
  position: SalaryPosition;
};

export type EstimatorSuccess = {
  ok: true;
  estimatedLevel: WageLevel;
  confidence: Confidence;
  occupation: SocOccupation;
  locationLabel: string;
  usedStateFallback: boolean;
  salaryComparison: SalaryComparisonRow[];
  reasoning: string[];
};

export type EstimatorError = {
  ok: false;
  code: "occupation_not_found" | "location_not_available";
  message: string;
};

export type EstimatorResult = EstimatorSuccess | EstimatorError;

const STATE_OPTIONS = [
  "TX",
  "CA",
  "NY",
  "NJ",
  "WA",
  "IL",
  "FL",
  "GA",
  "MA",
  "VA",
  "NC",
  "AZ",
  "CO",
  "PA",
  "OH",
  "MI",
] as const;

export { STATE_OPTIONS };

/** Demo base prevailing wages by SOC (Houston, TX reference). */
const SOC_BASE_WAGES: Record<string, WageLevelThresholds> = {
  "15-1252": { level1: 85000, level2: 105000, level3: 130000, level4: 155000 },
  "15-2051": { level1: 78000, level2: 98000, level3: 122000, level4: 148000 },
  "15-1211": { level1: 72000, level2: 92000, level3: 115000, level4: 138000 },
  "15-1253": { level1: 70000, level2: 88000, level3: 110000, level4: 132000 },
  "15-1212": { level1: 82000, level2: 102000, level3: 128000, level4: 152000 },
  "15-1242": { level1: 76000, level2: 95000, level3: 118000, level4: 142000 },
  "15-1244": { level1: 74000, level2: 93000, level3: 116000, level4: 138000 },
  "15-1299": { level1: 80000, level2: 102000, level3: 128000, level4: 152000 },
  "13-1082": { level1: 78000, level2: 98000, level3: 122000, level4: 146000 },
  "13-1111": { level1: 72000, level2: 90000, level3: 112000, level4: 134000 },
  "13-1161": { level1: 68000, level2: 85000, level3: 106000, level4: 127000 },
  "13-2011": { level1: 58000, level2: 72000, level3: 90000, level4: 108000 },
  "13-2051": { level1: 70000, level2: 88000, level3: 110000, level4: 132000 },
  "11-3021": { level1: 110000, level2: 138000, level3: 172000, level4: 205000 },
  "17-2051": { level1: 68000, level2: 85000, level3: 106000, level4: 127000 },
  "17-2071": { level1: 78000, level2: 98000, level3: 122000, level4: 146000 },
  "17-2141": { level1: 72000, level2: 90000, level3: 112000, level4: 134000 },
  "17-2199": { level1: 70000, level2: 88000, level3: 110000, level4: 132000 },
  "29-1051": { level1: 90000, level2: 112000, level3: 140000, level4: 167000 },
  "29-1141": { level1: 62000, level2: 78000, level3: 97000, level4: 116000 },
  "25-1021": { level1: 68000, level2: 85000, level3: 106000, level4: 127000 },
};

/** Group-level demo wage fallback for occupations without SOC-specific demo tables. */
const GROUP_DEFAULT_WAGES: Record<string, WageLevelThresholds> = {
  "Management Occupations": { level1: 90000, level2: 115000, level3: 145000, level4: 175000 },
  "Business & Financial Operations Occupations": { level1: 62000, level2: 78000, level3: 98000, level4: 118000 },
  "Computer & Mathematical Occupations": { level1: 78000, level2: 98000, level3: 122000, level4: 148000 },
  "Architecture & Engineering Occupations": { level1: 72000, level2: 90000, level3: 112000, level4: 134000 },
  "Life, Physical, & Social Science Occupations": { level1: 58000, level2: 74000, level3: 92000, level4: 110000 },
  "Community & Social Service Occupations": { level1: 42000, level2: 52000, level3: 65000, level4: 78000 },
  "Legal Occupations": { level1: 62000, level2: 82000, level3: 105000, level4: 130000 },
  "Educational Instruction & Library Occupations": { level1: 48000, level2: 60000, level3: 75000, level4: 90000 },
  "Arts, Design, Entertainment, Sports, & Media Occupations": { level1: 45000, level2: 58000, level3: 72000, level4: 88000 },
  "Healthcare Practitioners & Technical Occupations": { level1: 68000, level2: 88000, level3: 110000, level4: 132000 },
  "Healthcare Support Occupations": { level1: 32000, level2: 40000, level3: 50000, level4: 60000 },
  "Protective Service Occupations": { level1: 38000, level2: 48000, level3: 60000, level4: 72000 },
  "Food Preparation & Serving Related Occupations": { level1: 24000, level2: 30000, level3: 38000, level4: 46000 },
  "Building & Grounds Cleaning & Maintenance Occupations": { level1: 28000, level2: 35000, level3: 44000, level4: 53000 },
  "Personal Care & Service Occupations": { level1: 26000, level2: 33000, level3: 41000, level4: 50000 },
  "Sales & Related Occupations": { level1: 34000, level2: 44000, level3: 55000, level4: 66000 },
  "Office & Administrative Support Occupations": { level1: 32000, level2: 40000, level3: 50000, level4: 60000 },
  "Farming, Fishing, & Forestry Occupations": { level1: 28000, level2: 35000, level3: 44000, level4: 53000 },
  "Construction & Extraction Occupations": { level1: 38000, level2: 48000, level3: 60000, level4: 72000 },
  "Installation, Maintenance, & Repair Occupations": { level1: 40000, level2: 50000, level3: 62000, level4: 75000 },
  "Production Occupations": { level1: 32000, level2: 40000, level3: 50000, level4: 60000 },
  "Transportation & Material Moving Occupations": { level1: 34000, level2: 42000, level3: 53000, level4: 64000 },
  "Military Specific Occupations": { level1: 36000, level2: 45000, level3: 56000, level4: 68000 },
  "Other Occupations": { level1: 40000, level2: 50000, level3: 62000, level4: 75000 },
};

type LocationWageKey = `${string}|${string}`;

function locationKey(city: string, state: string): LocationWageKey {
  return `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
}

/** Location multipliers relative to Houston, TX demo baseline. */
const LOCATION_MULTIPLIERS: Record<string, number> = {
  "houston|TX": 1.0,
  "dallas|TX": 0.97,
  "austin|TX": 1.03,
  "san francisco|CA": 1.35,
  "new york|NY": 1.3,
  "seattle|WA": 1.25,
  "chicago|IL": 1.08,
  "state|TX": 0.95,
  "state|CA": 1.22,
  "state|NY": 1.18,
  "state|WA": 1.15,
  "state|IL": 1.04,
};

/**
 * Demo prevailing wage tables — city + SOC and state fallback (sample values only).
 * Keys: "city|STATE" or "state|STATE" for statewide fallback.
 */
const DEMO_WAGE_TABLES: Record<string, Record<string, WageLevelThresholds>> = {
  "houston|TX": {
    "15-1252": { level1: 85000, level2: 105000, level3: 130000, level4: 155000 },
    "15-2051": { level1: 78000, level2: 98000, level3: 122000, level4: 148000 },
    "15-1211": { level1: 72000, level2: 92000, level3: 115000, level4: 138000 },
    "15-1299": { level1: 80000, level2: 102000, level3: 128000, level4: 152000 },
    "13-2011": { level1: 58000, level2: 72000, level3: 90000, level4: 108000 },
  },
  "dallas|TX": {
    "15-1252": { level1: 82000, level2: 102000, level3: 127000, level4: 150000 },
    "15-2051": { level1: 76000, level2: 95000, level3: 118000, level4: 142000 },
    "15-1211": { level1: 70000, level2: 88000, level3: 110000, level4: 132000 },
    "15-1299": { level1: 78000, level2: 99000, level3: 124000, level4: 148000 },
    "13-2011": { level1: 56000, level2: 70000, level3: 88000, level4: 105000 },
  },
  "austin|TX": {
    "15-1252": { level1: 88000, level2: 108000, level3: 134000, level4: 158000 },
    "15-2051": { level1: 80000, level2: 100000, level3: 125000, level4: 150000 },
    "15-1211": { level1: 74000, level2: 94000, level3: 117000, level4: 140000 },
    "15-1299": { level1: 82000, level2: 104000, level3: 130000, level4: 154000 },
    "13-2011": { level1: 60000, level2: 74000, level3: 92000, level4: 110000 },
  },
  "san francisco|CA": {
    "15-1252": { level1: 110000, level2: 135000, level3: 165000, level4: 195000 },
    "15-2051": { level1: 105000, level2: 128000, level3: 158000, level4: 188000 },
    "15-1211": { level1: 95000, level2: 118000, level3: 145000, level4: 172000 },
    "15-1299": { level1: 102000, level2: 126000, level3: 155000, level4: 184000 },
    "13-2011": { level1: 72000, level2: 88000, level3: 108000, level4: 128000 },
  },
  "new york|NY": {
    "15-1252": { level1: 105000, level2: 128000, level3: 158000, level4: 188000 },
    "15-2051": { level1: 100000, level2: 122000, level3: 150000, level4: 178000 },
    "15-1211": { level1: 90000, level2: 112000, level3: 138000, level4: 165000 },
    "15-1299": { level1: 98000, level2: 120000, level3: 148000, level4: 176000 },
    "13-2011": { level1: 68000, level2: 84000, level3: 104000, level4: 124000 },
  },
  "seattle|WA": {
    "15-1252": { level1: 102000, level2: 125000, level3: 154000, level4: 182000 },
    "15-2051": { level1: 98000, level2: 120000, level3: 148000, level4: 175000 },
    "15-1211": { level1: 88000, level2: 110000, level3: 136000, level4: 162000 },
    "15-1299": { level1: 96000, level2: 118000, level3: 145000, level4: 172000 },
    "13-2011": { level1: 66000, level2: 82000, level3: 102000, level4: 121000 },
  },
  "chicago|IL": {
    "15-1252": { level1: 90000, level2: 112000, level3: 138000, level4: 164000 },
    "15-2051": { level1: 86000, level2: 106000, level3: 132000, level4: 156000 },
    "15-1211": { level1: 78000, level2: 98000, level3: 122000, level4: 145000 },
    "15-1299": { level1: 84000, level2: 105000, level3: 130000, level4: 154000 },
    "13-2011": { level1: 60000, level2: 74000, level3: 92000, level4: 110000 },
  },
  "state|TX": {
    "15-1252": { level1: 80000, level2: 100000, level3: 125000, level4: 148000 },
    "15-2051": { level1: 75000, level2: 94000, level3: 117000, level4: 140000 },
    "15-1211": { level1: 69000, level2: 87000, level3: 109000, level4: 130000 },
    "15-1299": { level1: 77000, level2: 97000, level3: 121000, level4: 144000 },
    "13-2011": { level1: 55000, level2: 69000, level3: 86000, level4: 103000 },
  },
  "state|CA": {
    "15-1252": { level1: 100000, level2: 122000, level3: 150000, level4: 178000 },
    "15-2051": { level1: 95000, level2: 116000, level3: 143000, level4: 170000 },
    "15-1211": { level1: 86000, level2: 107000, level3: 132000, level4: 157000 },
    "15-1299": { level1: 92000, level2: 113000, level3: 139000, level4: 165000 },
    "13-2011": { level1: 65000, level2: 80000, level3: 99000, level4: 118000 },
  },
  "state|NY": {
    "15-1252": { level1: 98000, level2: 120000, level3: 148000, level4: 176000 },
    "15-2051": { level1: 93000, level2: 114000, level3: 141000, level4: 168000 },
    "15-1211": { level1: 84000, level2: 105000, level3: 130000, level4: 155000 },
    "15-1299": { level1: 90000, level2: 111000, level3: 137000, level4: 163000 },
    "13-2011": { level1: 64000, level2: 79000, level3: 98000, level4: 117000 },
  },
  "state|WA": {
    "15-1252": { level1: 96000, level2: 118000, level3: 146000, level4: 173000 },
    "15-2051": { level1: 91000, level2: 112000, level3: 138000, level4: 164000 },
    "15-1211": { level1: 82000, level2: 103000, level3: 127000, level4: 151000 },
    "15-1299": { level1: 88000, level2: 109000, level3: 134000, level4: 159000 },
    "13-2011": { level1: 62000, level2: 77000, level3: 96000, level4: 114000 },
  },
  "state|IL": {
    "15-1252": { level1: 86000, level2: 107000, level3: 132000, level4: 157000 },
    "15-2051": { level1: 82000, level2: 101000, level3: 125000, level4: 149000 },
    "15-1211": { level1: 74000, level2: 93000, level3: 116000, level4: 138000 },
    "15-1299": { level1: 80000, level2: 100000, level3: 124000, level4: 147000 },
    "13-2011": { level1: 57000, level2: 71000, level3: 88000, level4: 105000 },
  },
};

function scaleThresholds(thresholds: WageLevelThresholds, multiplier: number): WageLevelThresholds {
  const round = (value: number) => Math.round(value / 1000) * 1000;
  return {
    level1: round(thresholds.level1 * multiplier),
    level2: round(thresholds.level2 * multiplier),
    level3: round(thresholds.level3 * multiplier),
    level4: round(thresholds.level4 * multiplier),
  };
}

function resolveLocationMultiplier(city: string, state: string): number | null {
  const cityKey = locationKey(city, state);
  if (LOCATION_MULTIPLIERS[cityKey] !== undefined) {
    return LOCATION_MULTIPLIERS[cityKey];
  }

  const stateKey = locationKey("state", state);
  if (LOCATION_MULTIPLIERS[stateKey] !== undefined) {
    return LOCATION_MULTIPLIERS[stateKey];
  }

  return null;
}

/** Resolve demo wage thresholds for city/state + SOC, with state and scaled-base fallbacks. */
function resolveWageThresholds(
  city: string,
  state: string,
  socCode: string,
): { thresholds: WageLevelThresholds; locationLabel: string; usedStateFallback: boolean } | null {
  const cityKey = locationKey(city, state);
  const stateFallbackKey = locationKey("state", state);

  const cityTable = DEMO_WAGE_TABLES[cityKey]?.[socCode];
  if (cityTable) {
    const cityLabel = city.trim()
      ? `${city.trim()}, ${state.toUpperCase()}`
      : state.toUpperCase();
    return { thresholds: cityTable, locationLabel: cityLabel, usedStateFallback: false };
  }

  const stateTable = DEMO_WAGE_TABLES[stateFallbackKey]?.[socCode];
  if (stateTable) {
    return {
      thresholds: stateTable,
      locationLabel: `${state.toUpperCase()} (statewide demo fallback)`,
      usedStateFallback: true,
    };
  }

  const baseWages = SOC_BASE_WAGES[socCode];
  const multiplier = resolveLocationMultiplier(city, state);
  if (baseWages && multiplier !== null) {
    const cityLabel = city.trim()
      ? `${city.trim()}, ${state.toUpperCase()}`
      : state.toUpperCase();
    return {
      thresholds: scaleThresholds(baseWages, multiplier),
      locationLabel: `${cityLabel} (scaled demo wages)`,
      usedStateFallback: !DEMO_WAGE_TABLES[cityKey],
    };
  }

  const occupation = getOccupationByCode(socCode);
  const groupWages = occupation ? GROUP_DEFAULT_WAGES[occupation.group] : undefined;
  if (groupWages && multiplier !== null) {
    const cityLabel = city.trim()
      ? `${city.trim()}, ${state.toUpperCase()}`
      : state.toUpperCase();
    return {
      thresholds: scaleThresholds(groupWages, multiplier),
      locationLabel: `${cityLabel} (group demo wages)`,
      usedStateFallback: !DEMO_WAGE_TABLES[cityKey],
    };
  }

  return null;
}

/** Map annual salary to prevailing wage level using level thresholds. */
export function salaryToWageLevel(salary: number, thresholds: WageLevelThresholds): WageLevel {
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

function buildSalaryComparison(
  salary: number,
  thresholds: WageLevelThresholds,
): SalaryComparisonRow[] {
  const levels: Array<{ level: WageLevel; wage: number }> = [
    { level: "I", wage: thresholds.level1 },
    { level: "II", wage: thresholds.level2 },
    { level: "III", wage: thresholds.level3 },
    { level: "IV", wage: thresholds.level4 },
  ];

  return levels.map(({ level, wage }) => ({
    level,
    annualWage: wage,
    position: salaryPosition(salary, wage),
  }));
}

/**
 * Adjust confidence using experience and education — does not override salary level
 * unless experience strongly conflicts with a high level.
 */
function computeConfidence(
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

function levelLabel(level: WageLevel): string {
  return `Level ${level}`;
}

function buildReasoning(
  input: EstimatorInput,
  occupation: SocOccupation,
  locationLabel: string,
  estimatedLevel: WageLevel,
  thresholds: WageLevelThresholds,
  confidence: Confidence,
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
    `Based on demo wage data for ${occupation.title} (${occupation.code}) in ${locationLabel}.`,
  );

  if (confidence === "Low") {
    bullets.push("Confidence is reduced because experience and salary signals are mixed.");
  }

  return bullets;
}

export function socEntryToOccupation(entry: SocOccupationEntry): SocOccupation {
  return { code: entry.code, title: entry.title };
}

/** Main estimator entry point. */
export function estimateH1bWageLevel(input: EstimatorInput): EstimatorResult {
  const socEntry = getOccupationByCode(input.socCode);
  if (!socEntry) {
    return {
      ok: false,
      code: "occupation_not_found",
      message: "Please select a valid SOC occupation from the search results.",
    };
  }

  const occupation = socEntryToOccupation(socEntry);
  const wageMatch = resolveWageThresholds(input.workCity, input.state, occupation.code);
  if (!wageMatch) {
    return {
      ok: false,
      code: "location_not_available",
      message:
        "Location not available in demo data. Try Houston TX, Dallas TX, Austin TX, San Francisco CA, New York NY, Seattle WA, or Chicago IL.",
    };
  }

  const { thresholds, locationLabel, usedStateFallback } = wageMatch;
  const estimatedLevel = salaryToWageLevel(input.annualSalary, thresholds);
  const confidence = computeConfidence(estimatedLevel, input.experience, input.education);
  const salaryComparison = buildSalaryComparison(input.annualSalary, thresholds);

  const reasoning = buildReasoning(
    input,
    occupation,
    locationLabel,
    estimatedLevel,
    thresholds,
    confidence,
  );

  if (usedStateFallback) {
    reasoning.push("City-specific demo data was unavailable; statewide demo fallback was used.");
  }

  return {
    ok: true,
    estimatedLevel,
    confidence,
    occupation,
    locationLabel,
    usedStateFallback,
    salaryComparison,
    reasoning,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
