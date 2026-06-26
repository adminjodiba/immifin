create table public.immigration_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  default_category text,
  default_country text,
  default_bulletin_type text,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint immigration_profiles_profile_id_unique unique (profile_id)
);

create index immigration_profiles_profile_id_idx
  on public.immigration_profiles (profile_id);

create trigger immigration_profiles_set_updated_at
before update on public.immigration_profiles
for each row
execute function public.set_updated_at();

create or replace function public.create_immigration_profile_for_profile()
returns trigger
language plpgsql
as $$
begin
  insert into public.immigration_profiles (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

create trigger profiles_create_immigration_profile
after insert on public.profiles
for each row
execute function public.create_immigration_profile_for_profile();
