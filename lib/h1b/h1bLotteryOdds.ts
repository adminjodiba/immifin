/**
 * H-1B Lottery Selection Estimate.
 *
 * The percentages below are DHS modeled wage-level selection estimates and a
 * DHS modeled random-selection baseline, adopted by IMMIFIN. They are not
 * individualized predictions, official USCIS selection odds, or a guarantee
 * that any specific beneficiary will be selected.
 *
 * IMMIFIN does not invent a combined wage-level × master's percentage.
 * Advanced-degree exemption eligibility is communicated separately and does
 * not change the modeled wage-level estimate.
 */

import type { WageLevel } from "@/lib/h1b/wage/estimatorDisplay.types";

export type LotteryWageLevelSelection = WageLevel | "unknown";
export type UsMastersEligibility = "no" | "yes";

/** DHS modeled wage-level selection estimates adopted by IMMIFIN. */
export const DHS_MODELED_SELECTION_ESTIMATES: Record<WageLevel, number> = {
  I: 15.29,
  II: 30.58,
  III: 45.87,
  IV: 61.16,
};

/** DHS modeled random-selection baseline adopted by IMMIFIN. */
export const DHS_MODELED_RANDOM_BASELINE = 29.59;

export type LotteryOddsInput = {
  wageLevel: LotteryWageLevelSelection;
  usMastersEligible: UsMastersEligibility;
};

export type LotteryOddsResult = {
  wageLevel: WageLevel;
  usMastersEligible: boolean;
  modeledEstimate: number;
  randomBaseline: number;
  differenceFromBaseline: number;
  reasoning: string[];
};

function roundTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

/** Format a signed percentage-point difference without a leading "+-" bug. */
export function formatSignedPercentagePoints(value: number): string {
  const rounded = roundTwoDecimals(value);
  if (rounded === 0) {
    return "0.00 percentage points";
  }
  if (rounded > 0) {
    return `+${rounded.toFixed(2)} percentage points`;
  }
  return `−${Math.abs(rounded).toFixed(2)} percentage points`;
}

export function calculateH1bLotteryOdds(input: LotteryOddsInput): LotteryOddsResult | null {
  if (input.wageLevel === "unknown") {
    return null;
  }

  const modeledEstimate = DHS_MODELED_SELECTION_ESTIMATES[input.wageLevel];
  const usMastersEligible = input.usMastersEligible === "yes";
  const differenceFromBaseline = roundTwoDecimals(modeledEstimate - DHS_MODELED_RANDOM_BASELINE);

  const reasoning = [
    `DHS modeled wage-level selection estimate for Level ${input.wageLevel}: ${modeledEstimate.toFixed(2)}%.`,
    usMastersEligible
      ? "Advanced-degree exemption eligible. A qualifying U.S. master's degree or higher provides an additional selection opportunity through the advanced-degree exemption process. DHS does not publish a separate wage-level-specific percentage that IMMIFIN can reliably add to the modeled estimate above."
      : "Advanced-degree exemption is not being applied.",
    `DHS modeled random-selection baseline: ${DHS_MODELED_RANDOM_BASELINE.toFixed(2)}%.`,
    `Difference from modeled random baseline: ${formatSignedPercentagePoints(differenceFromBaseline)}.`,
    "These percentages are DHS modeled estimates based on DHS modeling assumptions. They are not guarantees of individual selection. Actual outcomes depend on the actual registration and beneficiary population and the selection process.",
  ];

  return {
    wageLevel: input.wageLevel,
    usMastersEligible,
    modeledEstimate,
    randomBaseline: DHS_MODELED_RANDOM_BASELINE,
    differenceFromBaseline,
    reasoning,
  };
}

export function parseWageLevelParam(value: string | null | undefined): LotteryWageLevelSelection {
  if (!value) {
    return "unknown";
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "I" || normalized === "II" || normalized === "III" || normalized === "IV") {
    return normalized;
  }

  return "unknown";
}
