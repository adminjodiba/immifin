// Next step: replace this seed list with the full O*NET-SOC 2019 occupation CSV/JSON dataset.

import { SOC_OCCUPATIONS_SEED } from "@/lib/h1b/data/socOccupationsSeed";
import { mapOnetRecordsToOccupations } from "@/lib/h1b/data/onetSocImport";
import type { SocOccupationEntry } from "@/lib/h1b/types/socOccupation";

export type { SocOccupationEntry };

/**
 * Active occupation dataset.
 * Swap SOC_OCCUPATIONS_SEED for mapOnetRecordsToOccupations(imported) when O*NET file is added.
 */
export const SOC_OCCUPATIONS: SocOccupationEntry[] = SOC_OCCUPATIONS_SEED;

const occupationByCode = new Map<string, SocOccupationEntry>(
  SOC_OCCUPATIONS.map((occupation) => [occupation.code, occupation]),
);

/** Data-layer lookup by SOC code. Prefer occupationService.getOccupationByCode in application code. */
export function getSocOccupationByCode(code: string): SocOccupationEntry | undefined {
  return occupationByCode.get(code.trim());
}

/** User-facing occupation title (no SOC code). */
export function formatOccupationTitle(occupation: SocOccupationEntry): string {
  return occupation.title;
}

/** Technical label including SOC code — for admin/debug use only. */
export function formatSocLabel(occupation: SocOccupationEntry): string {
  return `SOC ${occupation.code} — ${occupation.title}`;
}

/** Re-export for future O*NET CSV/JSON import pipeline. */
export { mapOnetRecordsToOccupations };

export const SOC_OCCUPATION_COUNT = SOC_OCCUPATIONS.length;
