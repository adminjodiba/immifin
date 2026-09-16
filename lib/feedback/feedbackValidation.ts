import { maskEmailForPublicDisplay } from "@/lib/feedback/maskEmailForPublicDisplay";

export const FEEDBACK_LIMITS = {
  ratingMin: 1,
  ratingMax: 5,
  feedbackTextMin: 10,
  feedbackTextMax: 1000,
  displayNameMax: 50,
  maxBodyBytes: 20_000,
} as const;

export const FEEDBACK_PUBLIC_DISPLAY_NAME_FALLBACK = "IMMIFIN User";

export const FEEDBACK_ALLOWED_INPUT_KEYS = [
  "rating",
  "feedbackText",
  "displayName",
  "publicationPermission",
] as const;

const FORBIDDEN_INPUT_KEYS = [
  "id",
  "profile_id",
  "profileId",
  "clerk_user_id",
  "clerkUserId",
  "moderation_status",
  "moderationStatus",
  "featured",
  "moderated_at",
  "moderatedAt",
  "moderated_by_clerk_user_id",
  "moderatedByClerkUserId",
  "moderated_by",
  "moderation_note",
  "moderationNote",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "last_submitted_at",
  "lastSubmittedAt",
  "publication_permission_granted_at",
  "publicationPermissionGrantedAt",
] as const;

export type FeedbackSubmissionInput = {
  rating: unknown;
  feedbackText?: unknown;
  displayName?: unknown;
  publicationPermission: unknown;
};

export type ValidatedFeedbackSubmission = {
  rating: number;
  feedbackText: string;
  displayName: string | null;
  publicationPermission: boolean;
};

export type FeedbackValidationResult =
  | { ok: true; data: ValidatedFeedbackSubmission }
  | { ok: false; error: string };

export const FEEDBACK_VALIDATION_ERROR = "Please check your feedback and try again.";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasForbiddenKey(record: Record<string, unknown>): boolean {
  return FORBIDDEN_INPUT_KEYS.some((key) => Object.prototype.hasOwnProperty.call(record, key));
}

function hasUnknownKey(record: Record<string, unknown>): boolean {
  const allowed = new Set<string>(FEEDBACK_ALLOWED_INPUT_KEYS);
  return Object.keys(record).some((key) => !allowed.has(key));
}

export function validateFeedbackSubmission(input: unknown): FeedbackValidationResult {
  if (!isPlainObject(input)) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  if (hasForbiddenKey(input) || hasUnknownKey(input)) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  if (typeof input.rating !== "number" || !Number.isInteger(input.rating)) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  const rating = input.rating;
  if (rating < FEEDBACK_LIMITS.ratingMin || rating > FEEDBACK_LIMITS.ratingMax) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  if (typeof input.feedbackText !== "string") {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  const feedbackText = input.feedbackText.trim();
  if (
    feedbackText.length < FEEDBACK_LIMITS.feedbackTextMin ||
    feedbackText.length > FEEDBACK_LIMITS.feedbackTextMax
  ) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  if (input.publicationPermission !== true && input.publicationPermission !== false) {
    return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
  }

  let displayName: string | null = null;
  if (input.displayName !== undefined && input.displayName !== null) {
    if (typeof input.displayName !== "string") {
      return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
    }
    const trimmedName = input.displayName.trim();
    if (trimmedName.length === 0) {
      displayName = null;
    } else if (trimmedName.length > FEEDBACK_LIMITS.displayNameMax) {
      return { ok: false, error: FEEDBACK_VALIDATION_ERROR };
    } else {
      displayName = trimmedName;
    }
  }

  return {
    ok: true,
    data: {
      rating,
      feedbackText,
      displayName,
      publicationPermission: input.publicationPermission,
    },
  };
}

export function resolvePublicDisplayName(displayName: string | null | undefined): string {
  return resolvePublicTestimonialIdentity(displayName);
}

export function resolvePublicTestimonialIdentity(
  displayName: string | null | undefined,
  loginEmail?: unknown,
): string {
  const trimmed = displayName?.trim() ?? "";
  if (trimmed.length > 0) {
    return trimmed;
  }

  return maskEmailForPublicDisplay(loginEmail) ?? FEEDBACK_PUBLIC_DISPLAY_NAME_FALLBACK;
}
