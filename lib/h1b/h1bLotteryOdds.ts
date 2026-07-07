/**
 * H-1B Lottery Odds Calculator — mock assumptions (educational only).
 */

import type { WageLevel } from "@/lib/h1b/wageLevelEstimator";

export type LotteryWageLevelSelection = WageLevel | "unknown";
export type UsMastersEligibility = "no" | "yes";

export const WAGE_LEVEL_LOTTERY_ODDS: Record<WageLevel, number> = {
  I: 15.3,
  II: 30.6,
  III: 45.9,
  IV: 61.2,
};

export const TRADITIONAL_RANDOM_LOTTERY_ODDS = 29.6;
export const US_MASTERS_CAP_BOOST = 8;
export const MAX_DISPLAYED_ODDS = 95;

export type LotteryOddsInput = {
  wageLevel: LotteryWageLevelSelection;
  usMastersEligible: UsMastersEligibility;
};

export type LotteryOddsResult = {
  wageLevel: WageLevel;
  usMastersEligible: boolean;
  wageWeightedRegularEstimate: number;
  mastersCapBoost: number;
  finalEstimatedOdds: number;
  traditionalRandomEstimate: number;
  advantageOverTraditional: number;
  reasoning: string[];
};

function roundOneDecimal(value: number): number {
  return Number(value.toFixed(1));
}

/** Apply master's cap boost and cap final odds at 95%. */
export function calculateH1bLotteryOdds(input: LotteryOddsInput): LotteryOddsResult | null {
  if (input.wageLevel === "unknown") {
    return null;
  }

  const wageWeightedRegularEstimate = WAGE_LEVEL_LOTTERY_ODDS[input.wageLevel];
  const usMastersEligible = input.usMastersEligible === "yes";
  const mastersCapBoost = usMastersEligible ? US_MASTERS_CAP_BOOST : 0;
  const finalEstimatedOdds = roundOneDecimal(
    Math.min(MAX_DISPLAYED_ODDS, wageWeightedRegularEstimate + mastersCapBoost),
  );
  const advantageOverTraditional = roundOneDecimal(
    finalEstimatedOdds - TRADITIONAL_RANDOM_LOTTERY_ODDS,
  );

  const reasoning = [
    `Wage-weighted regular estimate for Level ${input.wageLevel}: ${wageWeightedRegularEstimate}%.`,
    usMastersEligible
      ? `U.S. master's cap eligible: Yes (+${US_MASTERS_CAP_BOOST.toFixed(1)} percentage points in this demo model).`
      : "U.S. master's cap eligible: No.",
    `Final estimated odds combine wage-weighting${usMastersEligible ? " and master's boost" : ""}, capped at ${MAX_DISPLAYED_ODDS}%.`,
    `Traditional random lottery estimate: ${TRADITIONAL_RANDOM_LOTTERY_ODDS}%.`,
    `Estimated advantage over traditional random lottery: +${advantageOverTraditional} percentage points.`,
    "These odds use sample weighted-selection assumptions and should be updated when final USCIS/DHS selection data is available.",
  ];

  return {
    wageLevel: input.wageLevel,
    usMastersEligible,
    wageWeightedRegularEstimate,
    mastersCapBoost,
    finalEstimatedOdds,
    traditionalRandomEstimate: TRADITIONAL_RANDOM_LOTTERY_ODDS,
    advantageOverTraditional,
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
