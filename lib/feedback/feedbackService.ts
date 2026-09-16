import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { UserFeedback } from "@/lib/supabase/types";
import {
  decideFeedbackWrite,
  FEEDBACK_THROTTLE_ERROR,
  isPubliclyVisibleFeedback,
  toPublishedUserFeedback,
  type PublishedUserFeedback,
} from "@/lib/feedback/feedbackRules";
import type { ValidatedFeedbackSubmission } from "@/lib/feedback/feedbackValidation";

export {
  FEEDBACK_THROTTLE_ERROR,
  FEEDBACK_UPDATE_THROTTLE_MS,
  type PublishedUserFeedback,
} from "@/lib/feedback/feedbackRules";

const FEEDBACK_SAVE_ERROR = "We couldn't save your feedback right now. Please try again.";
const FEEDBACK_READ_ERROR = "We couldn't load feedback right now. Please try again.";

export class FeedbackServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FeedbackServiceError";
    this.status = status;
  }
}

export function isFeedbackServiceError(error: unknown): error is FeedbackServiceError {
  return error instanceof FeedbackServiceError;
}

export type OwnerFeedbackResponse = {
  rating: number;
  feedbackText: string;
  displayName: string | null;
  publicationPermission: boolean;
  moderationStatus: UserFeedback["moderation_status"];
  updatedAt: string;
};

function mapUserFeedback(row: UserFeedback): OwnerFeedbackResponse {
  return {
    rating: row.rating,
    feedbackText: row.feedback_text,
    displayName: row.display_name,
    publicationPermission: row.publication_permission,
    moderationStatus: row.moderation_status,
    updatedAt: row.updated_at,
  };
}

async function getLatestFeedbackByProfileId(profileId: string): Promise<UserFeedback | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select("*")
    .eq("profile_id", profileId)
    .order("last_submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new FeedbackServiceError(FEEDBACK_SAVE_ERROR, 500);
  }

  return data ? (data as UserFeedback) : null;
}

export async function submitUserFeedback(input: {
  profileId: string;
  clerkUserId: string;
  submission: ValidatedFeedbackSubmission;
  now?: Date;
}): Promise<{ created: boolean; feedback: OwnerFeedbackResponse }> {
  const now = input.now ?? new Date();
  const latest = await getLatestFeedbackByProfileId(input.profileId);
  const decision = decideFeedbackWrite({
    existing: latest,
    profileId: input.profileId,
    clerkUserId: input.clerkUserId,
    submission: input.submission,
    now,
  });

  if (decision.type === "throttle") {
    throw new FeedbackServiceError(FEEDBACK_THROTTLE_ERROR, 429);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .insert(decision.payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new FeedbackServiceError(FEEDBACK_SAVE_ERROR, 500);
  }

  return { created: true, feedback: mapUserFeedback(data as UserFeedback) };
}

export async function getPublishedUserFeedback(): Promise<PublishedUserFeedback[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("user_feedback")
    .select(
      "rating, feedback_text, display_name, created_at, featured, moderation_status, publication_permission",
    )
    .eq("moderation_status", "approved")
    .eq("publication_permission", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new FeedbackServiceError(FEEDBACK_READ_ERROR, 500);
  }

  return (data ?? [])
    .filter((row) =>
      isPubliclyVisibleFeedback({
        moderation_status: row.moderation_status as UserFeedback["moderation_status"],
        publication_permission: row.publication_permission as boolean,
      }),
    )
    .map((row) =>
      toPublishedUserFeedback({
        rating: row.rating as number,
        feedback_text: row.feedback_text as string,
        display_name: row.display_name as string | null,
        created_at: row.created_at as string,
        featured: Boolean(row.featured),
      }),
    );
}
