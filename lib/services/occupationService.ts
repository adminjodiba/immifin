/**
 * Occupation Intelligence service — shared occupation search and matching for IMMIFIN tools.
 *
 * Future consumers:
 * - H-1B Wage Level Estimator
 * - H-1B Lottery Odds Calculator
 * - PERM wage tools
 * - Salary benchmark pages
 * - Occupation SEO pages
 *
 * Data source: lib/h1b/socOccupations.ts (seed today; full O*NET-SOC 2019 import later).
 */

import {
  SOC_OCCUPATIONS,
  getSocOccupationByCode,
  type SocOccupationEntry,
} from "@/lib/h1b/socOccupations";

export type MatchConfidence = "High" | "Medium" | "Low";
export type MatchedOn = "title" | "keyword" | "group" | "code";

export type OccupationSearchResult = {
  occupation: SocOccupationEntry;
  matchScore: number;
  matchConfidence: MatchConfidence;
  matchedOn: MatchedOn;
};

const DEFAULT_SEARCH_LIMIT = 75;

/** SOC major groups commonly seen in H-1B filings (demo classification). */
const TYPICAL_H1B_GROUPS = new Set<string>([
  "Management Occupations",
  "Business & Financial Operations Occupations",
  "Computer & Mathematical Occupations",
  "Architecture & Engineering Occupations",
  "Life, Physical, & Social Science Occupations",
  "Educational Instruction & Library Occupations",
  "Healthcare Practitioners & Technical Occupations",
]);

type ScoredMatch = {
  score: number;
  matchedOn: MatchedOn;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function confidenceFromScore(score: number): MatchConfidence {
  if (score >= 850) {
    return "High";
  }
  if (score >= 700) {
    return "Medium";
  }
  return "Low";
}

function scoreOccupationMatch(occupation: SocOccupationEntry, normalized: string): ScoredMatch | null {
  const title = occupation.title.toLowerCase();
  const group = occupation.group.toLowerCase();
  const code = occupation.code.toLowerCase();

  for (const keyword of occupation.keywords) {
    const keywordNormalized = keyword.trim().toLowerCase();
    if (keywordNormalized && keywordNormalized === normalized) {
      return { score: 1000, matchedOn: "keyword" };
    }
  }

  if (title === normalized) {
    return { score: 950, matchedOn: "title" };
  }

  if (title.startsWith(normalized) || normalized.startsWith(title)) {
    return { score: 900, matchedOn: "title" };
  }

  for (const keyword of occupation.keywords) {
    const keywordNormalized = keyword.trim().toLowerCase();
    if (
      keywordNormalized &&
      (keywordNormalized.startsWith(normalized) || normalized.startsWith(keywordNormalized))
    ) {
      return { score: 850 + Math.min(keywordNormalized.length, 50), matchedOn: "keyword" };
    }
  }

  for (const keyword of occupation.keywords) {
    const keywordNormalized = keyword.trim().toLowerCase();
    if (
      keywordNormalized &&
      (normalized.includes(keywordNormalized) || keywordNormalized.includes(normalized))
    ) {
      return {
        score: 800 + Math.min(keywordNormalized.length, 50),
        matchedOn: "keyword",
      };
    }
  }

  if (title.includes(normalized)) {
    return { score: 700 + Math.min(normalized.length, 50), matchedOn: "title" };
  }

  if (group.includes(normalized)) {
    return { score: 600, matchedOn: "group" };
  }

  if (code.includes(normalized)) {
    return { score: 500, matchedOn: "code" };
  }

  return null;
}

function toSearchResult(occupation: SocOccupationEntry, scored: ScoredMatch): OccupationSearchResult {
  return {
    occupation,
    matchScore: scored.score,
    matchConfidence: confidenceFromScore(scored.score),
    matchedOn: scored.matchedOn,
  };
}

function browseResults(limit: number): OccupationSearchResult[] {
  return [...SOC_OCCUPATIONS]
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((occupation) => ({
      occupation,
      matchScore: 0,
      matchConfidence: "Low" as MatchConfidence,
      matchedOn: "title" as MatchedOn,
    }));
}

/** Search occupations ranked by match quality. */
export function searchOccupations(query: string, limit = DEFAULT_SEARCH_LIMIT): OccupationSearchResult[] {
  const normalized = normalizeSearchText(query);

  if (!normalized) {
    return browseResults(limit);
  }

  return SOC_OCCUPATIONS.map((occupation) => {
    const scored = scoreOccupationMatch(occupation, normalized);
    if (!scored) {
      return null;
    }
    return toSearchResult(occupation, scored);
  })
    .filter((result): result is OccupationSearchResult => result !== null)
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore || a.occupation.title.localeCompare(b.occupation.title),
    )
    .slice(0, limit);
}

/** Lookup a single occupation by SOC code. */
export function getOccupationByCode(code: string): SocOccupationEntry | undefined {
  return getSocOccupationByCode(code);
}

/** Return keyword aliases for an occupation. */
export function getOccupationKeywords(code: string): string[] {
  const occupation = getOccupationByCode(code);
  return occupation?.keywords ?? [];
}

/** Whether an occupation sits in a group commonly associated with H-1B filings. */
export function isTypicalH1BOccupation(code: string): boolean {
  const occupation = getOccupationByCode(code);
  if (!occupation) {
    return false;
  }
  return TYPICAL_H1B_GROUPS.has(occupation.group);
}

/** Related occupations from the same major group. */
export function getRelatedOccupations(code: string, limit = 5): SocOccupationEntry[] {
  const occupation = getOccupationByCode(code);
  if (!occupation) {
    return [];
  }

  return SOC_OCCUPATIONS.filter(
    (entry) => entry.group === occupation.group && entry.code !== occupation.code,
  )
    .sort((a, b) => a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Score how well a query matches a specific occupation. */
export function getOccupationMatchConfidence(
  query: string,
  occupation: SocOccupationEntry,
): OccupationSearchResult | null {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return null;
  }

  const scored = scoreOccupationMatch(occupation, normalized);
  if (!scored) {
    return null;
  }

  return toSearchResult(occupation, scored);
}

/** Best occupation match for a free-text job title (e.g. unsubmitted search input). */
export function matchOccupationFromQuery(query: string): OccupationSearchResult | null {
  return searchOccupations(query, 1)[0] ?? null;
}

export function formatOccupationTitle(occupation: SocOccupationEntry): string {
  return occupation.title;
}

export type { SocOccupationEntry };
