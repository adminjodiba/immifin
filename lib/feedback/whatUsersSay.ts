import { resolvePublicTestimonialIdentity } from "@/lib/feedback/feedbackValidation";

export const WHAT_USERS_SAY_MAX_TESTIMONIALS = 100;
export const WHAT_USERS_SAY_ROW_COUNT = 4;
/** Bounded pool window so unique-user selection never scans the full table. */
export const WHAT_USERS_SAY_CANDIDATE_LIMIT = 500;
export const WHAT_USERS_SAY_CACHE_TAG = "what-users-say-daily";
export const WHAT_USERS_SAY_CACHE_REVALIDATE_SECONDS = 86_400;

/** Pool columns only. Login email is never selected into the public snapshot. */
export const WHAT_USERS_SAY_PUBLIC_COLUMNS =
  "id, profile_id, rating, feedback_text, display_name, created_at" as const;

export type WhatUsersSayCandidate = {
  id: string;
  profileId: string;
  rating: number;
  feedbackText: string;
  displayName: string;
  createdAt: string;
};

export type PublicWhatUsersSayTestimonial = {
  key: string;
  rating: number;
  feedbackText: string;
  displayName: string;
  createdAt: string;
};

export type WhatUsersSayDailySnapshot = {
  selectedCount: number;
  rows: [
    PublicWhatUsersSayTestimonial[],
    PublicWhatUsersSayTestimonial[],
    PublicWhatUsersSayTestimonial[],
    PublicWhatUsersSayTestimonial[],
  ];
};

export function compareWhatUsersSayRank(
  left: Pick<WhatUsersSayCandidate, "rating" | "createdAt" | "id">,
  right: Pick<WhatUsersSayCandidate, "rating" | "createdAt" | "id">,
): number {
  if (left.rating !== right.rating) {
    return right.rating - left.rating;
  }
  if (left.createdAt !== right.createdAt) {
    return right.createdAt.localeCompare(left.createdAt);
  }
  return right.id.localeCompare(left.id);
}

export function pickUniqueTopTestimonials(
  ranked: WhatUsersSayCandidate[],
  max = WHAT_USERS_SAY_MAX_TESTIMONIALS,
): WhatUsersSayCandidate[] {
  const seen = new Set<string>();
  const picked: WhatUsersSayCandidate[] = [];

  for (const row of ranked) {
    if (seen.has(row.profileId)) {
      continue;
    }
    seen.add(row.profileId);
    picked.push(row);
    if (picked.length >= max) {
      break;
    }
  }

  return picked;
}

export function rowSizesForCount(count: number): [number, number, number, number] {
  const safeCount = Math.max(0, count);
  const base = Math.floor(safeCount / WHAT_USERS_SAY_ROW_COUNT);
  const remainder = safeCount % WHAT_USERS_SAY_ROW_COUNT;
  return [
    base + (remainder > 0 ? 1 : 0),
    base + (remainder > 1 ? 1 : 0),
    base + (remainder > 2 ? 1 : 0),
    base,
  ];
}

export function distributeIntoFourRows(
  items: PublicWhatUsersSayTestimonial[],
): WhatUsersSayDailySnapshot["rows"] {
  const rows: WhatUsersSayDailySnapshot["rows"] = [[], [], [], []];
  items.forEach((item, index) => {
    rows[index % WHAT_USERS_SAY_ROW_COUNT].push(item);
  });
  return rows;
}

export function toPublicWhatUsersSayTestimonial(
  row: WhatUsersSayCandidate,
  rank: number,
): PublicWhatUsersSayTestimonial {
  return {
    key: `wus-${rank}`,
    rating: row.rating,
    feedbackText: row.feedbackText,
    displayName: resolvePublicTestimonialIdentity(row.displayName),
    createdAt: row.createdAt,
  };
}

export function buildWhatUsersSaySnapshot(
  rankedCandidates: WhatUsersSayCandidate[],
): WhatUsersSayDailySnapshot {
  const unique = pickUniqueTopTestimonials(rankedCandidates);
  const publicItems = unique.map((row, index) => toPublicWhatUsersSayTestimonial(row, index + 1));
  return {
    selectedCount: publicItems.length,
    rows: distributeIntoFourRows(publicItems),
  };
}

export function emptyWhatUsersSaySnapshot(): WhatUsersSayDailySnapshot {
  return {
    selectedCount: 0,
    rows: [[], [], [], []],
  };
}
