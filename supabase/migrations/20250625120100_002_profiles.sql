create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  email text not null,
  role public.app_user_role not null default 'user',
  plan public.app_plan not null default 'free',
  display_name text,
  avatar_url text,
  status public.profile_status not null default 'active',
  role_updated_at timestamptz,
  role_updated_by_clerk_user_id text,
  last_seen_at timestamptz,
  clerk_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_clerk_user_id_unique unique (clerk_user_id),
  constraint profiles_email_unique unique (email),
  constraint profiles_email_lowercase check (email = lower(email))
);

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);
create index profiles_plan_idx on public.profiles (plan);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.track_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role then
    new.role_updated_at = now();
  end if;

  return new;
end;
$$;

create trigger profiles_track_role_change
before update on public.profiles
for each row
execute function public.track_profile_role_change();
