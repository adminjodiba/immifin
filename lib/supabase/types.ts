export type AppUserRole = "user" | "admin";

export type AppPlan = "free" | "basic" | "pro";

export type ProfileStatus = "active" | "suspended" | "deleted";

export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type Profile = {
  id: string;
  clerk_user_id: string;
  email: string;
  role: AppUserRole;
  plan: AppPlan;
  display_name: string | null;
  avatar_url: string | null;
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
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileWithRelations = {
  profile: Profile;
  immigrationProfile: ImmigrationProfile | null;
  subscription: Subscription | null;
};
