/**
 * Import adapter for the full O*NET-SOC 2019 occupation dataset.
 *
 * Drop-in workflow (future):
 * 1. Download O*NET-SOC 2019 crosswalk CSV or JSON from:
 *    https://www.onetcenter.org/taxonomy.html
 * 2. Place file at: lib/h1b/data/onet-soc-2019.json
 * 3. Run: npx tsx scripts/import-onet-soc.ts
 * 4. Generated output replaces SOC_OCCUPATIONS_SEED in socOccupationsSeed.ts
 *
 * Expected source JSON shape (array):
 * {
 *   "soc_code": "15-1252.00",
 *   "title": "Software Developers",
 *   "major_group": "Computer and Mathematical Occupations",
 *   "alternate_titles": ["Software Engineer", "Application Developer"]
 * }
 */

import type { SocOccupationEntry } from "@/lib/h1b/types/socOccupation";
import { groupFromSocCode } from "@/lib/h1b/data/socMajorGroups";

export type OnetSocSourceRecord = {
  soc_code: string;
  title: string;
  major_group?: string;
  alternate_titles?: string[];
};

function normalizeSocCode(raw: string): string {
  return raw.trim().replace(/\.00$/, "");
}

function titleToKeywords(title: string): string[] {
  const normalized = title.trim().toLowerCase();
  const keywords = [normalized];
  if (normalized.includes(",")) {
    keywords.push(normalized.split(",")[0]?.trim() ?? normalized);
  }
  return [...new Set(keywords.filter(Boolean))];
}

/** Map official O*NET-SOC records into IMMIFIN occupation entries. */
export function mapOnetRecordsToOccupations(records: OnetSocSourceRecord[]): SocOccupationEntry[] {
  const seen = new Set<string>();

  return records
    .map((record) => {
      const code = normalizeSocCode(record.soc_code);
      if (!/^\d{2}-\d{4}$/.test(code) || seen.has(code)) {
        return null;
      }
      seen.add(code);

      const title = record.title.trim();
      const keywords = [
        ...titleToKeywords(title),
        ...(record.alternate_titles ?? []).map((value) => value.trim().toLowerCase()),
      ];

      return {
        code,
        title,
        group: record.major_group?.trim() || groupFromSocCode(code),
        keywords: [...new Set(keywords.filter(Boolean))],
      } satisfies SocOccupationEntry;
    })
    .filter((entry): entry is SocOccupationEntry => entry !== null)
    .sort((a, b) => a.code.localeCompare(b.code));
}
