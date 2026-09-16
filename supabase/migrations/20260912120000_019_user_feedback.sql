-- S7A-DS2-FEEDBACK-DB-002: User feedback schema foundation.
-- One active feedback row per profile. Server-side service-role access only.

-- -----------------------------------------------------------------------------
-- 1. Moderation status enum
-- -----------------------------------------------------------------------------

create type public.feedback_moderation_status as enum (
  'pending',
  'approved',
  'rejected'
);

-- -----------------------------------------------------------------------------
-- 2. user_feedback
-- -----------------------------------------------------------------------------

create table public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  clerk_user_id text not null,
  rating smallint not null,
  feedback_text text not null,
  display_name text,
  publication_permission boolean not null,
  publication_permission_granted_at timestamptz,
  moderation_status public.feedback_moderation_status not null default 'pending',
  featured boolean not null default false,
  moderated_at timestamptz,
  moderated_by_clerk_user_id text,
  moderation_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_submitted_at timestamptz not null default now(),
  constraint user_feedback_profile_id_unique unique (profile_id),
  constraint user_feedback_rating_range_check check (
    rating between 1 and 5
  ),
  constraint user_feedback_feedback_text_length_check check (
    char_length(feedback_text) between 10 and 1000
  ),
  constraint user_feedback_display_name_length_check check (
    display_name is null or char_length(display_name) between 1 and 50
  ),
  constraint user_feedback_publication_consent_check check (
    (
      publication_permission = true
      and publication_permission_granted_at is not null
    )
    or (
      publication_permission = false
      and publication_permission_granted_at is null
    )
  ),
  constraint user_feedback_featured_public_approved_check check (
    featured = false
    or (
      featured = true
      and moderation_status = 'approved'
      and publication_permission = true
    )
  )
);

comment on table public.user_feedback is
  'One active user feedback row per profile. Public display requires approved + publication permission.';

comment on column public.user_feedback.last_submitted_at is
  'User submit/resubmit time only. The 24-hour update throttle uses this column, not updated_at. Admin moderation must not change it.';

comment on column public.user_feedback.updated_at is
  'Any row modification, including future admin moderation. Do not use for the user-update throttle.';

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

create index user_feedback_public_approved_idx
  on public.user_feedback (
    moderation_status,
    publication_permission,
    featured desc,
    created_at desc
  );

create index user_feedback_moderation_queue_idx
  on public.user_feedback (moderation_status, created_at desc);

create index user_feedback_clerk_user_id_idx
  on public.user_feedback (clerk_user_id);

-- -----------------------------------------------------------------------------
-- 4. updated_at trigger (reuse existing function)
-- -----------------------------------------------------------------------------

create trigger user_feedback_set_updated_at
before update on public.user_feedback
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. RLS — Phase 1 service-role only, no client policies
-- -----------------------------------------------------------------------------

alter table public.user_feedback enable row level security;

-- Phase 1: all application access uses SUPABASE_SERVICE_ROLE_KEY from Next.js server routes.
-- Client-facing RLS policies are added in a later phase.
