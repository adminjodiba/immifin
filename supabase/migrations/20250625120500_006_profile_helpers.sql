create or replace function public.upsert_profile_from_clerk(
  p_clerk_user_id text,
  p_email text,
  p_display_name text default null,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  insert into public.profiles (
    clerk_user_id,
    email,
    display_name,
    avatar_url,
    clerk_synced_at
  )
  values (
    p_clerk_user_id,
    lower(trim(p_email)),
    p_display_name,
    p_avatar_url,
    now()
  )
  on conflict (clerk_user_id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    clerk_synced_at = now(),
    updated_at = now()
  where public.profiles.status <> 'deleted'
  returning * into v_profile;

  return v_profile;
end;
$$;

create or replace function public.set_profile_role(
  p_clerk_user_id text,
  p_new_role public.app_user_role,
  p_changed_by_clerk_user_id text default null,
  p_changed_by_email text default null,
  p_change_source text default 'manual_sql',
  p_metadata jsonb default '{}'::jsonb
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_previous_role public.app_user_role;
begin
  select *
  into v_profile
  from public.profiles
  where clerk_user_id = p_clerk_user_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active profile not found for clerk_user_id: %', p_clerk_user_id;
  end if;

  v_previous_role := v_profile.role;

  if v_previous_role = p_new_role then
    return v_profile;
  end if;

  update public.profiles
  set
    role = p_new_role,
    role_updated_at = now(),
    role_updated_by_clerk_user_id = p_changed_by_clerk_user_id
  where id = v_profile.id
  returning * into v_profile;

  insert into public.admin_role_changes (
    target_profile_id,
    target_clerk_user_id,
    target_email,
    previous_role,
    new_role,
    changed_by_clerk_user_id,
    changed_by_email,
    change_source,
    metadata
  )
  values (
    v_profile.id,
    v_profile.clerk_user_id,
    v_profile.email,
    v_previous_role,
    p_new_role,
    p_changed_by_clerk_user_id,
    p_changed_by_email,
    p_change_source,
    p_metadata
  );

  return v_profile;
end;
$$;

create or replace function public.soft_delete_profile_by_clerk_id(
  p_clerk_user_id text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
begin
  update public.profiles
  set status = 'deleted'
  where clerk_user_id = p_clerk_user_id
  returning * into v_profile;

  if not found then
    raise exception 'Profile not found for clerk_user_id: %', p_clerk_user_id;
  end if;

  return v_profile;
end;
$$;
