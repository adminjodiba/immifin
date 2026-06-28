alter table public.immigration_profiles
  add column priority_date date;

comment on column public.immigration_profiles.priority_date is
  'Optional priority date for green card wait time calculator defaults.';
