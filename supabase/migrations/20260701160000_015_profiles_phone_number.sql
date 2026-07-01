alter table public.profiles
  add column if not exists phone_number text;

comment on column public.profiles.phone_number is
  'User contact phone for IMMIFIN immigration alerts and notifications. Not used for authentication.';
