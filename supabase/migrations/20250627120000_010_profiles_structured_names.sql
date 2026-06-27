alter table public.profiles
  add column first_name text,
  add column last_name text;

comment on column public.profiles.first_name is
  'Clerk first name. Nullable for existing rows until synced from identity.';

comment on column public.profiles.last_name is
  'Clerk last name. Nullable for existing rows until synced from identity.';
