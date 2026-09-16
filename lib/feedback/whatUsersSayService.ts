import { unstable_cache } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { resolvePublicTestimonialIdentity } from "@/lib/feedback/feedbackValidation";
import {
  WHAT_USERS_SAY_CACHE_REVALIDATE_SECONDS,
  WHAT_USERS_SAY_CACHE_TAG,
  WHAT_USERS_SAY_CANDIDATE_LIMIT,
  WHAT_USERS_SAY_PUBLIC_COLUMNS,
  buildWhatUsersSaySnapshot,
  emptyWhatUsersSaySnapshot,
  type WhatUsersSayCandidate,
  type WhatUsersSayDailySnapshot,
} from "@/lib/feedback/whatUsersSay";

type PoolCandidateRow = {
  id: string;
  profile_id: string;
  rating: number;
  feedback_text: string;
  display_name: string | null;
  created_at: string;
};

async function loadLoginEmailsByProfileId(profileIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  const emails = new Map<string, string>();
  if (uniqueIds.length === 0) {
    return emails;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("profiles").select("id, email").in("id", uniqueIds);
  if (error) {
    console.error("[what-users-say] profile email lookup failed:", error.message);
    return emails;
  }

  for (const row of data ?? []) {
    if (typeof row.id === "string" && typeof row.email === "string") {
      emails.set(row.id, row.email);
    }
  }

  return emails;
}

async function loadWhatUsersSayPoolCandidates(): Promise<WhatUsersSayCandidate[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select(WHAT_USERS_SAY_PUBLIC_COLUMNS)
    .eq("moderation_status", "approved")
    .eq("publication_permission", true)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(WHAT_USERS_SAY_CANDIDATE_LIMIT);

  if (error) {
    console.error("[what-users-say] pool snapshot query failed:", error.message);
    throw error;
  }

  const rows = (data ?? []) as PoolCandidateRow[];
  const profileIdsNeedingEmail = rows
    .filter((row) => !(row.display_name ?? "").trim())
    .map((row) => row.profile_id);
  const emailsByProfileId = await loadLoginEmailsByProfileId(profileIdsNeedingEmail);

  return rows.map((row) => ({
    id: row.id,
    profileId: row.profile_id,
    rating: row.rating,
    feedbackText: row.feedback_text,
    displayName: resolvePublicTestimonialIdentity(
      row.display_name,
      emailsByProfileId.get(row.profile_id) ?? null,
    ),
    createdAt: row.created_at,
  }));
}

async function buildDailySnapshot(): Promise<WhatUsersSayDailySnapshot> {
  try {
    const candidates = await loadWhatUsersSayPoolCandidates();
    return buildWhatUsersSaySnapshot(candidates);
  } catch (error: unknown) {
    console.error("[what-users-say] daily snapshot failed:", error);
    return emptyWhatUsersSaySnapshot();
  }
}

const getCachedWhatUsersSayDailySnapshot = unstable_cache(
  buildDailySnapshot,
  ["what-users-say-daily-snapshot"],
  {
    revalidate: WHAT_USERS_SAY_CACHE_REVALIDATE_SECONDS,
    tags: [WHAT_USERS_SAY_CACHE_TAG],
  },
);

export async function getWhatUsersSayDailySnapshot(): Promise<WhatUsersSayDailySnapshot> {
  if (process.env.NODE_ENV === "development") {
    return buildDailySnapshot();
  }

  return getCachedWhatUsersSayDailySnapshot();
}
