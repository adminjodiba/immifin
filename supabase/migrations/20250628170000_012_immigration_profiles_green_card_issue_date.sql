alter table public.immigration_profiles
  add column green_card_issue_date date;

comment on column public.immigration_profiles.green_card_issue_date is
  'Optional green card issue date for citizenship eligibility tracking.';
