-- Minimal campaign/send records for Monthly Immigration Update bulk sends (S6-EMAIL-004.2).
-- Transactional notification state lives in Supabase (not Google Sheets).

create table public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_type text not null default 'monthly_immigration_update',
  bulletin_month text not null,
  status text not null,
  pro_count integer not null default 0,
  power_count integer not null default 0,
  total_recipients integer not null default 0,
  success_count integer not null default 0,
  failure_count integer not null default 0,
  skipped_count integer not null default 0,
  provider text,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  actor_clerk_user_id text,
  actor_email text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_campaigns_status_check check (
    status in (
      'ready_to_send',
      'sending',
      'completed',
      'completed_with_failures',
      'already_sent',
      'not_ready'
    )
  ),
  constraint notification_campaigns_bulletin_month_format check (
    bulletin_month ~ '^\d{4}-\d{2}$'
  )
);

create index notification_campaigns_bulletin_month_idx
  on public.notification_campaigns (bulletin_month);

create index notification_campaigns_created_at_idx
  on public.notification_campaigns (created_at desc);

-- At most one completed (or completed-with-failures) campaign per bulletin month.
create unique index notification_campaigns_completed_bulletin_uidx
  on public.notification_campaigns (campaign_type, bulletin_month)
  where status in ('completed', 'completed_with_failures');

-- At most one in-progress send per bulletin month.
create unique index notification_campaigns_sending_bulletin_uidx
  on public.notification_campaigns (campaign_type, bulletin_month)
  where status = 'sending';

alter table public.notification_campaigns enable row level security;
