import {
  OFFICIAL_OCCUPATION_SEARCH_LIMIT,
  OFFICIAL_SOC_SEARCH_PREFIX_RE,
  type OfficialOccupationRow,
} from "@/lib/h1b/occupations/officialOccupationSearch.types";

type RankedOccupation = {
  occupation: OfficialOccupationRow;
  rank: number;
};

function titleRank(titleLower: string, queryLower: string): number | null {
  if (titleLower === queryLower) return 2;
  if (titleLower.startsWith(queryLower)) return 3;
  if (titleLower.includes(queryLower)) return 4;
  return null;
}

/**
 * In-memory official occupation filter.
 * Does not invent synonyms. Deterministic order:
 * exact SOC, SOC prefix, exact title, title prefix, title contains;
 * then title ASC, soc_code ASC.
 */
export function filterOfficialOccupations(
  occupations: OfficialOccupationRow[],
  normalizedQuery: string,
  limit = OFFICIAL_OCCUPATION_SEARCH_LIMIT,
): OfficialOccupationRow[] {
  if (!normalizedQuery) {
    return [];
  }

  const queryLower = normalizedQuery.toLowerCase();
  const socPrefixQuery = OFFICIAL_SOC_SEARCH_PREFIX_RE.test(normalizedQuery);
  const ranked: RankedOccupation[] = [];

  for (const occupation of occupations) {
    const codeLower = occupation.socCode.toLowerCase();
    let rank: number | null = null;

    if (socPrefixQuery) {
      if (codeLower === queryLower) {
        rank = 0;
      } else if (codeLower.startsWith(queryLower)) {
        rank = 1;
      }
    }

    if (rank === null) {
      rank = titleRank(occupation.title.toLowerCase(), queryLower);
    }

    if (rank !== null) {
      ranked.push({ occupation, rank });
    }
  }

  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const titleCmp = a.occupation.title.localeCompare(b.occupation.title, "en");
    if (titleCmp !== 0) return titleCmp;
    return a.occupation.socCode.localeCompare(b.occupation.socCode, "en");
  });

  return ranked.slice(0, limit).map((item) => item.occupation);
}
