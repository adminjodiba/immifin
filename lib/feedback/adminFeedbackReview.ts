import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { AppPlan, UserFeedback } from "@/lib/supabase/types";
import {
  ADMIN_FEEDBACK_DEFAULT_PAGE_SIZE,
  ADMIN_FEEDBACK_MAX_PAGE_SIZE,
  ADMIN_FEEDBACK_PAGE_SIZES,
  type AdminFeedbackDetail,
  type AdminFeedbackListItem,
  type AdminFeedbackSort,
  type AdminFeedbackStatusCounts,
  type AdminFeedbackView,
  type AdminFeedbackYearCount,
  type AdminFeedbackBulkAction,
  type AdminFeedbackBulkResult,
} from "@/lib/feedback/adminFeedbackReviewTypes";

export {
  ADMIN_FEEDBACK_DEFAULT_PAGE_SIZE,
  ADMIN_FEEDBACK_MAX_PAGE_SIZE,
  ADMIN_FEEDBACK_PAGE_SIZES,
};

type FeedbackProfileJoin = {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: AppPlan | null;
  created_at: string | null;
};

type FeedbackListRow = Pick<
  UserFeedback,
  | "id"
  | "profile_id"
  | "rating"
  | "feedback_text"
  | "display_name"
  | "publication_permission"
  | "moderation_status"
  | "last_submitted_at"
  | "moderation_note"
  | "featured"
>;

const LIST_COLUMNS =
  "id, profile_id, rating, feedback_text, display_name, publication_permission, moderation_status, last_submitted_at, moderation_note, featured";

export class AdminFeedbackReviewError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminFeedbackReviewError";
    this.status = status;
  }
}

export function isAdminFeedbackReviewError(error: unknown): error is AdminFeedbackReviewError {
  return error instanceof AdminFeedbackReviewError;
}

function asCount(value: number | null): number {
  return value ?? 0;
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,()]/g, " ").replace(/\s+/g, " ").trim();
}

function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) {
    return "—";
  }

  const [local, domain] = email.split("@");
  const first = local?.[0] ?? "*";
  return `${first}***@${domain}`;
}

function previewText(value: string): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > 72 ? `${compact.slice(0, 72)}…` : compact;
}

function planLabel(plan: AppPlan | null | undefined): string | null {
  if (!plan) {
    return null;
  }

  if (plan === "pro" || plan === "basic") {
    return "Pro";
  }

  if (plan === "power") {
    return "Power";
  }

  return "Free";
}

function canApprovePublicly(row: Pick<UserFeedback, "moderation_status" | "publication_permission">): boolean {
  return row.moderation_status === "pending" && row.publication_permission === true;
}

function canAcknowledge(row: Pick<UserFeedback, "moderation_status" | "publication_permission">): boolean {
  return row.moderation_status === "pending" && row.publication_permission === false;
}

function canPublish(row: Pick<UserFeedback, "moderation_status" | "publication_permission">): boolean {
  return row.moderation_status === "approved" && row.publication_permission === true;
}

function mapListItem(row: FeedbackListRow, profile: FeedbackProfileJoin | null): AdminFeedbackListItem {
  return {
    id: row.id,
    displayName: row.display_name?.trim() || profile?.display_name?.trim() || "IMMIFIN User",
    maskedEmail: maskEmail(profile?.email),
    planTier: planLabel(profile?.plan),
    preview: previewText(row.feedback_text),
    feedbackText: row.feedback_text,
    rating: row.rating,
    submittedAt: row.last_submitted_at,
    publicationPermission: row.publication_permission,
    moderationStatus: row.moderation_status,
    moderationNote: row.moderation_note,
    featured: Boolean(row.featured),
    canApprovePublicly: canApprovePublicly(row),
    canAcknowledge: canAcknowledge(row),
    canPublish: canPublish(row),
    canDelete: canPublish(row),
  };
}

async function loadProfilesByIds(profileIds: string[]): Promise<Map<string, FeedbackProfileJoin>> {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, plan, created_at")
    .in("id", uniqueIds);

  if (error) {
    console.error("[admin-feedback] profile lookup failed:", error.message);
    return new Map();
  }

  return new Map(((data ?? []) as FeedbackProfileJoin[]).map((profile) => [profile.id, profile]));
}

async function findProfileIdsByEmailSearch(search: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("profiles").select("id").ilike("email", `%${search}%`).limit(100);

  if (error) {
    return [];
  }

  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
}

export function parseAdminFeedbackView(value: string | null): AdminFeedbackView {
  if (value === "private" || value === "pool") {
    return value;
  }

  if (value === "approved") {
    return "pool";
  }

  return "public";
}

export function parseAdminFeedbackSort(value: string | null): AdminFeedbackSort {
  return value === "oldest" ? "oldest" : "newest";
}

export function parseAdminFeedbackPageSize(value: string | null): number {
  const parsed = Number(value);
  if (parsed === 25 || parsed === 50 || parsed === 100) {
    return parsed;
  }

  return ADMIN_FEEDBACK_DEFAULT_PAGE_SIZE;
}

export function parseAdminFeedbackPage(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseAdminFeedbackYear(value: string | null): number | "all" {
  if (!value || value === "all") {
    return "all";
  }

  const year = Number(value);
  if (Number.isInteger(year) && year >= 2000 && year <= 2100) {
    return year;
  }

  return "all";
}

export function parseAdminFeedbackRating(value: string | null): number | null {
  const rating = Number(value);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
    return rating;
  }

  return null;
}

function applyViewFilter<T extends { eq: (column: string, value: string | boolean) => T }>(
  query: T,
  view: AdminFeedbackView,
): T {
  if (view === "public") {
    return query.eq("moderation_status", "pending").eq("publication_permission", true);
  }

  if (view === "private") {
    return query.eq("moderation_status", "pending").eq("publication_permission", false);
  }

  return query.eq("moderation_status", "approved").eq("publication_permission", true);
}

function applyYearFilter<T extends { gte: (column: string, value: string) => T; lt: (column: string, value: string) => T }>(
  query: T,
  year: number | "all",
): T {
  if (year === "all") {
    return query;
  }

  return query
    .gte("last_submitted_at", `${year}-01-01T00:00:00.000Z`)
    .lt("last_submitted_at", `${year + 1}-01-01T00:00:00.000Z`);
}

async function countFeedback(view: AdminFeedbackView, year: number | "all" = "all"): Promise<number> {
  const supabase = getSupabaseAdminClient();
  let query = supabase.from("user_feedback").select("id", { count: "exact", head: true });
  query = applyViewFilter(query, view);
  query = applyYearFilter(query, year);

  const { count, error } = await query;
  if (error) {
    throw new AdminFeedbackReviewError("Unable to load feedback counts.", 500);
  }

  return asCount(count);
}

export async function getAdminFeedbackStatusCounts(): Promise<AdminFeedbackStatusCounts> {
  const [publicCount, privateCount, pool] = await Promise.all([
    countFeedback("public"),
    countFeedback("private"),
    countFeedback("pool"),
  ]);

  return {
    public: publicCount,
    private: privateCount,
    pool,
  };
}

export async function getAdminFeedbackYearCounts(view: AdminFeedbackView): Promise<AdminFeedbackYearCount[]> {
  const supabase = getSupabaseAdminClient();
  let earliestQuery = supabase
    .from("user_feedback")
    .select("last_submitted_at")
    .order("last_submitted_at", { ascending: true })
    .limit(1);
  earliestQuery = applyViewFilter(earliestQuery, view);

  const { data: earliestRows, error: earliestError } = await earliestQuery;
  if (earliestError) {
    throw new AdminFeedbackReviewError("Unable to load feedback year counts.", 500);
  }

  const allCount = await countFeedback(view);
  const currentYear = new Date().getUTCFullYear();
  const earliestYear = earliestRows?.[0]?.last_submitted_at
    ? new Date(earliestRows[0].last_submitted_at as string).getUTCFullYear()
    : currentYear;

  const years: number[] = [];
  for (let year = currentYear; year >= earliestYear; year -= 1) {
    years.push(year);
  }

  const yearCounts = await Promise.all(years.map(async (year) => ({ year, count: await countFeedback(view, year) })));

  return [{ year: "all", count: allCount }, ...yearCounts];
}

export async function listAdminFeedback(input: {
  view: AdminFeedbackView;
  year: number | "all";
  page: number;
  pageSize: number;
  sort: AdminFeedbackSort;
  search?: string;
  rating?: number | null;
}): Promise<{ items: AdminFeedbackListItem[]; total: number; page: number; pageSize: number }> {
  const supabase = getSupabaseAdminClient();
  const from = (input.page - 1) * input.pageSize;
  const to = from + input.pageSize - 1;
  const ascending = input.sort === "oldest";

  let query = supabase
    .from("user_feedback")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("last_submitted_at", { ascending })
    .order("id", { ascending })
    .range(from, to);

  query = applyViewFilter(query, input.view);
  query = applyYearFilter(query, input.year);

  if (input.rating) {
    query = query.eq("rating", input.rating);
  }

  const search = input.search ? escapeIlike(input.search) : "";
  if (search) {
    const emailProfileIds = await findProfileIdsByEmailSearch(search);
    const searchFilters = [`feedback_text.ilike.%${search}%`, `display_name.ilike.%${search}%`];
    if (emailProfileIds.length > 0) {
      searchFilters.push(`profile_id.in.(${emailProfileIds.join(",")})`);
    }
    query = query.or(searchFilters.join(","));
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[admin-feedback] list query failed:", error.message);
    throw new AdminFeedbackReviewError("Unable to load feedback.", 500);
  }

  const rows = (data ?? []) as FeedbackListRow[];
  const profiles = await loadProfilesByIds(rows.map((row) => row.profile_id));

  return {
    items: rows.map((row) => mapListItem(row, profiles.get(row.profile_id) ?? null)),
    total: asCount(count),
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getAdminFeedbackDetail(id: string): Promise<AdminFeedbackDetail> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("user_feedback").select(LIST_COLUMNS).eq("id", id).maybeSingle();

  if (error) {
    throw new AdminFeedbackReviewError("Unable to load feedback details.", 500);
  }

  if (!data) {
    throw new AdminFeedbackReviewError("Feedback not found.", 404);
  }

  const row = data as FeedbackListRow;
  const profiles = await loadProfilesByIds([row.profile_id]);
  const profile = profiles.get(row.profile_id) ?? null;
  const item = mapListItem(row, profile);

  const { data: immigration } = await supabase
    .from("immigration_profiles")
    .select("default_country")
    .eq("profile_id", row.profile_id)
    .maybeSingle();

  return {
    ...item,
    memberSince: profile?.created_at ?? null,
    country: (immigration?.default_country as string | null) ?? null,
  };
}

export async function approveAdminFeedback(input: {
  id: string;
  actorClerkUserId: string;
}): Promise<AdminFeedbackDetail> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("user_feedback")
    .select("id, moderation_status, publication_permission")
    .eq("id", input.id)
    .maybeSingle();

  if (loadError) {
    throw new AdminFeedbackReviewError("Unable to update feedback.", 500);
  }

  if (!existing) {
    throw new AdminFeedbackReviewError("Feedback not found.", 404);
  }

  if (!canApprovePublicly(existing as Pick<UserFeedback, "moderation_status" | "publication_permission">)) {
    throw new AdminFeedbackReviewError(
      "Only pending public feedback can be approved for the testimonial pool.",
      409,
    );
  }

  const { error: updateError } = await supabase
    .from("user_feedback")
    .update({
      moderation_status: "approved",
      featured: false,
      moderated_at: new Date().toISOString(),
      moderated_by_clerk_user_id: input.actorClerkUserId,
    })
    .eq("id", input.id)
    .eq("moderation_status", "pending")
    .eq("publication_permission", true);

  if (updateError) {
    throw new AdminFeedbackReviewError("Unable to update feedback.", 500);
  }

  return getAdminFeedbackDetail(input.id);
}

export async function deleteAdminFeedback(input: {
  id: string;
  mode: "reject" | "acknowledge" | "delete";
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("user_feedback")
    .select("id, moderation_status, publication_permission")
    .eq("id", input.id)
    .maybeSingle();

  if (loadError) {
    throw new AdminFeedbackReviewError("Unable to delete feedback.", 500);
  }

  if (!existing) {
    throw new AdminFeedbackReviewError("Feedback not found.", 404);
  }

  const row = existing as Pick<UserFeedback, "moderation_status" | "publication_permission">;
  const allowed =
    (input.mode === "reject" && canApprovePublicly(row)) ||
    (input.mode === "acknowledge" && canAcknowledge(row)) ||
    (input.mode === "delete" && canPublish(row));

  if (!allowed) {
    throw new AdminFeedbackReviewError("This feedback cannot be deleted from the current queue.", 409);
  }

  let query = supabase.from("user_feedback").delete().eq("id", input.id);
  if (input.mode === "reject") {
    query = query.eq("moderation_status", "pending").eq("publication_permission", true);
  } else if (input.mode === "acknowledge") {
    query = query.eq("moderation_status", "pending").eq("publication_permission", false);
  } else {
    query = query.eq("moderation_status", "approved").eq("publication_permission", true);
  }

  const { error: deleteError } = await query;
  if (deleteError) {
    throw new AdminFeedbackReviewError("Unable to delete feedback.", 500);
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseAdminFeedbackBulkAction(value: unknown): AdminFeedbackBulkAction {
  if (value === "approve" || value === "reject" || value === "acknowledge" || value === "delete") {
    return value;
  }

  throw new AdminFeedbackReviewError("Unsupported bulk action.", 400);
}

export function parseAdminFeedbackBulkIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new AdminFeedbackReviewError("Select at least one feedback record.", 400);
  }

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string" || !UUID_PATTERN.test(item)) {
      throw new AdminFeedbackReviewError("One or more selected records are invalid.", 400);
    }
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
  }

  if (unique.length === 0) {
    throw new AdminFeedbackReviewError("Select at least one feedback record.", 400);
  }

  if (unique.length > ADMIN_FEEDBACK_MAX_PAGE_SIZE) {
    throw new AdminFeedbackReviewError("You can moderate at most 100 records at a time.", 400);
  }

  return unique;
}

export async function bulkModerateAdminFeedback(input: {
  ids: string[];
  action: AdminFeedbackBulkAction;
  actorClerkUserId: string;
}): Promise<AdminFeedbackBulkResult> {
  const ids = parseAdminFeedbackBulkIds(input.ids);
  const requested = ids.length;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select("id, moderation_status, publication_permission")
    .in("id", ids);

  if (error) {
    throw new AdminFeedbackReviewError("Unable to update feedback.", 500);
  }

  const rows = (data ?? []) as Array<
    Pick<UserFeedback, "id" | "moderation_status" | "publication_permission">
  >;
  const eligibleIds = rows
    .filter((row) => {
      if (input.action === "approve" || input.action === "reject") {
        return canApprovePublicly(row);
      }
      if (input.action === "delete") {
        return canPublish(row);
      }
      return canAcknowledge(row);
    })
    .map((row) => row.id);

  if (eligibleIds.length === 0) {
    return { requested, successful: 0, skipped: requested };
  }

  if (input.action === "approve") {
    const { data: updated, error: updateError } = await supabase
      .from("user_feedback")
      .update({
        moderation_status: "approved",
        featured: false,
        moderated_at: new Date().toISOString(),
        moderated_by_clerk_user_id: input.actorClerkUserId,
      })
      .in("id", eligibleIds)
      .eq("moderation_status", "pending")
      .eq("publication_permission", true)
      .select("id");

    if (updateError) {
      throw new AdminFeedbackReviewError("Unable to update feedback.", 500);
    }

    const successful = (updated ?? []).length;
    return { requested, successful, skipped: requested - successful };
  }

  let deleteQuery = supabase.from("user_feedback").delete().in("id", eligibleIds);
  if (input.action === "reject") {
    deleteQuery = deleteQuery.eq("moderation_status", "pending").eq("publication_permission", true);
  } else if (input.action === "acknowledge") {
    deleteQuery = deleteQuery.eq("moderation_status", "pending").eq("publication_permission", false);
  } else {
    deleteQuery = deleteQuery.eq("moderation_status", "approved").eq("publication_permission", true);
  }

  const { data: deleted, error: deleteError } = await deleteQuery.select("id");

  if (deleteError) {
    throw new AdminFeedbackReviewError("Unable to delete feedback.", 500);
  }

  const successful = (deleted ?? []).length;
  return { requested, successful, skipped: requested - successful };
}

export async function setAdminFeedbackPublished(input: {
  id: string;
  featured: boolean;
}): Promise<AdminFeedbackDetail> {
  const supabase = getSupabaseAdminClient();
  const { data: existing, error: loadError } = await supabase
    .from("user_feedback")
    .select("id, moderation_status, publication_permission")
    .eq("id", input.id)
    .maybeSingle();

  if (loadError) {
    throw new AdminFeedbackReviewError("Unable to update publish status.", 500);
  }

  if (!existing) {
    throw new AdminFeedbackReviewError("Feedback not found.", 404);
  }

  if (!canPublish(existing as Pick<UserFeedback, "moderation_status" | "publication_permission">)) {
    throw new AdminFeedbackReviewError(
      "Only approved feedback with publication permission can be published.",
      409,
    );
  }

  const { error: updateError } = await supabase
    .from("user_feedback")
    .update({ featured: input.featured })
    .eq("id", input.id)
    .eq("moderation_status", "approved")
    .eq("publication_permission", true);

  if (updateError) {
    throw new AdminFeedbackReviewError("Unable to update publish status.", 500);
  }

  return getAdminFeedbackDetail(input.id);
}

export async function saveAdminFeedbackNote(input: {
  id: string;
  note: string | null;
}): Promise<AdminFeedbackDetail> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("user_feedback")
    .update({ moderation_note: input.note })
    .eq("id", input.id);

  if (error) {
    throw new AdminFeedbackReviewError("Unable to save admin notes.", 500);
  }

  return getAdminFeedbackDetail(input.id);
}
