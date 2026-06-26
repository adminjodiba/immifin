alter table public.profiles
add column last_login_at timestamptz;

comment on column public.profiles.last_login_at is
  'Last successful Clerk sign-in. Updated when Clerk lastSignInAt is newer than the stored value.';

comment on column public.profiles.last_seen_at is
  'Last authenticated activity anywhere in the application.';

create index profiles_last_login_at_idx
  on public.profiles (last_login_at desc nulls last);
