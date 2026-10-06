export type AppUserRole = "user" | "admin";

export type AppPlan = "free" | "basic" | "pro" | "power";

export type ProfileStatus = "active" | "suspended" | "deleted";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type StripeWebhookEventStatus =
  | "received"
  | "processing"
  | "completed"
  | "failed";

export type StripeWebhookClaimOutcome =
  | "claimed"
  | "retry_claimed"
  | "already_completed"
  | "in_progress";

/** Stripe recurring interval values stored on subscriptions.billing_interval */
export type SubscriptionBillingInterval = "month" | "year";

export type FeedbackModerationStatus = "pending" | "approved" | "rejected";

export type UserFeedback = {
  id: string;
  profile_id: string;
  clerk_user_id: string;
  rating: number;
  feedback_text: string;
  display_name: string | null;
  publication_permission: boolean;
  publication_permission_granted_at: string | null;
  moderation_status: FeedbackModerationStatus;
  featured: boolean;
  moderated_at: string | null;
  moderated_by_clerk_user_id: string | null;
  moderation_note: string | null;
  created_at: string;
  updated_at: string;
  last_submitted_at: string;
};

export type Profile = {
  id: string;
  clerk_user_id: string;
  email: string;
  role: AppUserRole;
  plan: AppPlan;
  display_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  status: ProfileStatus;
  role_updated_at: string | null;
  role_updated_by_clerk_user_id: string | null;
  last_seen_at: string | null;
  last_login_at: string | null;
  clerk_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ImmigrationProfile = {
  id: string;
  profile_id: string;
  default_category: string | null;
  default_country: string | null;
  default_bulletin_type: string | null;
  priority_date: string | null;
  green_card_issue_date: string | null;
  married_to_us_citizen: boolean | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  profile_id: string;
  plan: AppPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  billing_interval: SubscriptionBillingInterval | null;
  stripe_status: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  last_synchronized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StripeWebhookEvent = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  status: StripeWebhookEventStatus;
  error_message: string | null;
  attempt_count: number;
  received_at: string;
  processing_started_at: string | null;
  processed_at: string | null;
  last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StripeWebhookClaimResult = {
  outcome: StripeWebhookClaimOutcome;
  event: StripeWebhookEvent;
};

export type NotificationOriginalEligibilityState = "eligible" | "excluded";

export type NotificationRecipientDeliveryState =
  | "audience_excluded"
  | "eligible_pending"
  | "attempt_in_progress"
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "submission_unknown"
  | "skipped_ineligible";

export type NotificationRecoveryRunStatus =
  | "requested"
  | "processing"
  | "completed"
  | "completed_with_failures";

export type NotificationDeliveryAttemptType = "original" | "retry";

export type NotificationDeliveryAttemptOutcome =
  | "claimed"
  | "provider_accepted"
  | "failed_before_provider"
  | "failed_provider"
  | "skipped_ineligible"
  | "submission_unknown";

export type NotificationCampaignRecipient = {
  id: string;
  campaign_id: string;
  profile_id: string;
  original_tier: "pro" | "power" | null;
  original_eligibility_state: NotificationOriginalEligibilityState;
  original_exclusion_reason: string | null;
  original_evaluated_at: string;
  latest_delivery_state: NotificationRecipientDeliveryState;
  latest_attempt_id: string | null;
  accepted_at: string | null;
  last_failure_code: string | null;
  last_failure_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRecoveryRun = {
  id: string;
  campaign_id: string;
  status: NotificationRecoveryRunStatus;
  idempotency_key: string;
  actor_profile_id: string | null;
  actor_clerk_user_id: string;
  actor_email: string;
  requested_at: string;
  processing_started_at: string | null;
  completed_at: string | null;
  attempted_recipient_count: number;
  provider_accepted_count: number;
  failed_before_provider_count: number;
  failed_provider_count: number;
  skipped_ineligible_count: number;
  submission_unknown_count: number;
  created_at: string;
  updated_at: string;
};

export type NotificationDeliveryAttempt = {
  id: string;
  campaign_recipient_id: string;
  recovery_run_id: string | null;
  attempt_number: number;
  attempt_type: NotificationDeliveryAttemptType;
  outcome: NotificationDeliveryAttemptOutcome;
  failure_stage: string | null;
  reason_code: string | null;
  reason_detail: string | null;
  provider: string | null;
  provider_message_id: string | null;
  provider_submission_key: string | null;
  tier_at_attempt: "pro" | "power" | null;
  attempted_at: string;
  completed_at: string | null;
  created_at: string;
};

export type NotificationRecoveryRunClaimOutcome =
  | "claimed"
  | "idempotent"
  | "campaign_not_found"
  | "campaign_not_recoverable"
  | "legacy_campaign"
  | "no_retryable_recipients"
  | "active_recovery_exists";

export type NotificationRecoveryRecipientClaimOutcome =
  | "claimed"
  | "recovery_run_not_found"
  | "recovery_run_not_active"
  | "recipient_not_in_campaign"
  | "already_provider_accepted"
  | "already_claimed"
  | "not_retryable"
  | "already_finalized_for_recovery";

export type NotificationRecoveryRunClaimResult = {
  outcome: NotificationRecoveryRunClaimOutcome;
  recovery_run?: NotificationRecoveryRun;
};

export type NotificationRecoveryRecipientClaimResult = {
  outcome: NotificationRecoveryRecipientClaimOutcome;
  attempt?: NotificationDeliveryAttempt;
  recipient?: NotificationCampaignRecipient;
  recovery_run?: NotificationRecoveryRun;
};

export type NotificationDeliveryAttemptFinalizeResult = {
  outcome: "finalized" | "attempt_not_found" | "already_finalized";
  attempt?: NotificationDeliveryAttempt;
  recipient?: NotificationCampaignRecipient;
};

export type NotificationRecoveryRunCompleteResult = {
  outcome:
    | "completed"
    | "recovery_run_not_found"
    | "already_completed"
    | "attempts_still_claimed";
  claimed_attempt_count?: number;
  recovery_run?: NotificationRecoveryRun;
};

export type ProfileWithRelations = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
  subscription: Subscription | null;
};
