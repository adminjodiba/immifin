import type { ValidatedFeedbackSubmission } from "./feedbackValidation";
import { resolvePublicDisplayName } from "./feedbackValidation";
import type { UserFeedback } from "../supabase/types";

export const FEEDBACK_UPDATE_THROTTLE_MS = 24 * 60 * 60 * 1000;

export const FEEDBACK_THROTTLE_ERROR =
  "You recently submitted feedback. Please wait before submitting again.";

export type FeedbackWritePayload = {
  profile_id: string;
  clerk_user_id: string;
  rating: number;
  feedback_text: string;
  display_name: string | null;
  publication_permission: boolean;
  publication_permission_granted_at: string | null;
  moderation_status: "pending";
  featured: false;
  moderated_at: null;
  moderated_by_clerk_user_id: null;
  moderation_note: null;
  last_submitted_at: string;
};

export type FeedbackWriteDecision =
  | { type: "create"; payload: FeedbackWritePayload }
  | { type: "throttle" };

export type PublishedFeedbackRow = Pick<
  UserFeedback,
  "rating" | "feedback_text" | "display_name" | "created_at" | "featured"
> &
  Partial<Pick<UserFeedback, "moderation_status" | "publication_permission">>;

export type PublishedUserFeedback = {
  rating: number;
  feedbackText: string;
  displayName: string;
  createdAt: string;
  featured: boolean;
};

export function isWithinFeedbackUpdateThrottle(lastSubmittedAt: string, nowMs: number): boolean {
  const lastSubmittedMs = Date.parse(lastSubmittedAt);
  if (!Number.isFinite(lastSubmittedMs)) {
    return false;
  }
  return nowMs - lastSubmittedMs < FEEDBACK_UPDATE_THROTTLE_MS;
}

export function buildFeedbackWritePayload(input: {
  profileId: string;
  clerkUserId: string;
  submission: ValidatedFeedbackSubmission;
  nowIso: string;
}): FeedbackWritePayload {
  return {
    profile_id: input.profileId,
    clerk_user_id: input.clerkUserId,
    rating: input.submission.rating,
    feedback_text: input.submission.feedbackText,
    display_name: input.submission.displayName,
    publication_permission: input.submission.publicationPermission,
    publication_permission_granted_at: input.submission.publicationPermission ? input.nowIso : null,
    moderation_status: "pending",
    featured: false,
    moderated_at: null,
    moderated_by_clerk_user_id: null,
    moderation_note: null,
    last_submitted_at: input.nowIso,
  };
}

export function decideFeedbackWrite(input: {
  existing: Pick<UserFeedback, "last_submitted_at"> | null;
  profileId: string;
  clerkUserId: string;
  submission: ValidatedFeedbackSubmission;
  now: Date;
}): FeedbackWriteDecision {
  const payload = buildFeedbackWritePayload({
    profileId: input.profileId,
    clerkUserId: input.clerkUserId,
    submission: input.submission,
    nowIso: input.now.toISOString(),
  });

  if (
    input.existing &&
    isWithinFeedbackUpdateThrottle(input.existing.last_submitted_at, input.now.getTime())
  ) {
    return { type: "throttle" };
  }

  return { type: "create", payload };
}

export function isPubliclyVisibleFeedback(row: {
  moderation_status?: UserFeedback["moderation_status"];
  publication_permission?: boolean;
}): boolean {
  return row.moderation_status === "approved" && row.publication_permission === true;
}

export function toPublishedUserFeedback(row: PublishedFeedbackRow): PublishedUserFeedback {
  return {
    rating: row.rating,
    feedbackText: row.feedback_text,
    displayName: resolvePublicDisplayName(row.display_name),
    createdAt: row.created_at,
    featured: Boolean(row.featured),
  };
}
