create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  actor_clerk_user_id text not null,
  actor_email text not null,
  action text not null,
  resource text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index admin_audit_log_actor_clerk_user_id_idx
  on public.admin_audit_log (actor_clerk_user_id);

create index admin_audit_log_action_idx
  on public.admin_audit_log (action);

create index admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);

create table public.admin_role_changes (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid not null references public.profiles (id) on delete cascade,
  target_clerk_user_id text not null,
  target_email text not null,
  previous_role public.app_user_role not null,
  new_role public.app_user_role not null,
  changed_by_clerk_user_id text,
  changed_by_email text,
  change_source text not null default 'manual_sql',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_role_changes_target_profile_id_idx
  on public.admin_role_changes (target_profile_id);

create index admin_role_changes_created_at_idx
  on public.admin_role_changes (created_at desc);
