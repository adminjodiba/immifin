import type { FeedbackModerationStatus } from "@/lib/supabase/types";

export const ADMIN_FEEDBACK_PAGE_SIZES = [25, 50, 100] as const;
export const ADMIN_FEEDBACK_DEFAULT_PAGE_SIZE = 25;
export const ADMIN_FEEDBACK_MAX_PAGE_SIZE = 100;

export type AdminFeedbackView = "public" | "private" | "pool";
export type AdminFeedbackSort = "newest" | "oldest";

export type AdminFeedbackStatusCounts = {
  public: number;
  private: number;
  pool: number;
};

export type AdminFeedbackYearCount = {
  year: number | "all";
  count: number;
};

export type AdminFeedbackListItem = {
  id: string;
  displayName: string;
  maskedEmail: string;
  planTier: string | null;
  preview: string;
  feedbackText: string;
  rating: number;
  submittedAt: string;
  publicationPermission: boolean;
  moderationStatus: FeedbackModerationStatus;
  moderationNote: string | null;
  featured: boolean;
  canApprovePublicly: boolean;
  canAcknowledge: boolean;
  canPublish: boolean;
  canDelete: boolean;
};

export type AdminFeedbackDetail = AdminFeedbackListItem & {
  memberSince: string | null;
  country: string | null;
};

export type AdminFeedbackBulkAction = "approve" | "reject" | "acknowledge" | "delete";

export type AdminFeedbackBulkResult = {
  requested: number;
  successful: number;
  skipped: number;
};
