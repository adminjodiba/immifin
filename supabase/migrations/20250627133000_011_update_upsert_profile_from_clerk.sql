create or replace function public.upsert_profile_from_clerk(
  p_clerk_user_id text,
  p_email text,
  p_first_name text default null,
  p_last_name text default null,
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
  v_email text := lower(trim(p_email));
  v_now timestamptz := now();
begin
  if p_clerk_user_id is null or btrim(p_clerk_user_id) = '' then
    raise exception 'clerk_user_id is required';
  end if;

  if v_email is null or v_email = '' then
    raise exception 'email is required';
  end if;

  -- Case 1: existing Clerk user id.
  select *
  into v_profile
  from public.profiles
  where clerk_user_id = p_clerk_user_id
  for update;

  if found then
    update public.profiles
    set
      email = v_email,
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name),
      display_name = coalesce(p_display_name, concat_ws(' ', p_first_name, p_last_name)),
      avatar_url = coalesce(p_avatar_url, avatar_url),
      clerk_synced_at = v_now,
      updated_at = v_now
    where id = v_profile.id
    returning * into v_profile;

    return v_profile;
  end if;

  -- Lookup by normalized email for cases 2–4.
  select *
  into v_profile
  from public.profiles
  where email = v_email
  for update;

  -- Case 2: brand new email.
  if not found then
    insert into public.profiles (
      clerk_user_id,
      email,
      first_name,
      last_name,
      display_name,
      avatar_url,
      status,
      clerk_synced_at
    )
    values (
      p_clerk_user_id,
      v_email,
      p_first_name,
      p_last_name,
      coalesce(p_display_name, concat_ws(' ', p_first_name, p_last_name)),
      p_avatar_url,
      'active',
      v_now
    )
    returning * into v_profile;

    return v_profile;
  end if;

  -- Case 3: deleted profile with same email — reactivate in place.
  if v_profile.status = 'deleted' then
    update public.profiles
    set
      status = 'active',
      clerk_user_id = p_clerk_user_id,
      email = v_email,
      first_name = coalesce(p_first_name, first_name),
      last_name = coalesce(p_last_name, last_name),
      display_name = coalesce(p_display_name, concat_ws(' ', p_first_name, p_last_name)),
      avatar_url = coalesce(p_avatar_url, avatar_url),
      clerk_synced_at = v_now,
      updated_at = v_now,
      last_seen_at = v_now,
      last_login_at = v_now
    where id = v_profile.id
    returning * into v_profile;

    return v_profile;
  end if;

  -- Case 4: active profile with same email — relink Clerk id, preserve business data.
  update public.profiles
  set
    clerk_user_id = p_clerk_user_id,
    email = v_email,
    first_name = coalesce(p_first_name, first_name),
    last_name = coalesce(p_last_name, last_name),
    display_name = coalesce(p_display_name, concat_ws(' ', p_first_name, p_last_name)),
    avatar_url = coalesce(p_avatar_url, avatar_url),
    clerk_synced_at = v_now,
    updated_at = v_now
  where id = v_profile.id
  returning * into v_profile;

  return v_profile;
end;
$$;
