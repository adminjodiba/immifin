-- S7A-DS2-FEEDBACK-HISTORY-006A: Multiple historical feedback rows per user.
-- 019 remains the original one-row-per-profile foundation. Do not rewrite it.

-- -----------------------------------------------------------------------------
-- 1. Allow more than one row per profile
-- -----------------------------------------------------------------------------

alter table public.user_feedback
  drop constraint user_feedback_profile_id_unique;

-- -----------------------------------------------------------------------------
-- 2. Latest-submission lookup for the rolling 24-hour throttle
-- -----------------------------------------------------------------------------

create index user_feedback_profile_last_submitted_idx
  on public.user_feedback (profile_id, last_submitted_at desc);

comment on table public.user_feedback is
  'Historical user feedback rows. Multiple rows per profile are allowed. Public display requires approved + publication permission.';

comment on column public.user_feedback.last_submitted_at is
  'User submit time for this row. The 24-hour new-submission throttle uses the latest last_submitted_at for the profile, not updated_at. Admin moderation must not change it.';
