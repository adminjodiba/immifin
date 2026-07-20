-- S7-DB-001: Stripe webhook event ledger and subscription synchronization schema foundation.
-- Durable idempotency for Stripe webhooks; extended subscription billing-state columns.

-- -----------------------------------------------------------------------------
-- 1. Internal Stripe webhook event ledger
-- -----------------------------------------------------------------------------

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null,
  event_type text not null,
  status text not null,
  error_message text,
  attempt_count integer not null default 0,
  received_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  last_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stripe_webhook_events_stripe_event_id_unique unique (stripe_event_id),
  constraint stripe_webhook_events_status_check check (
    status in ('received', 'processing', 'completed', 'failed')
  )
);

comment on table public.stripe_webhook_events is
  'Internal durable idempotency ledger for Stripe webhook processing.';

create index stripe_webhook_events_status_idx
  on public.stripe_webhook_events (status);

create index stripe_webhook_events_received_at_idx
  on public.stripe_webhook_events (received_at desc);

create index stripe_webhook_events_status_received_at_idx
  on public.stripe_webhook_events (status, received_at desc);

create trigger stripe_webhook_events_set_updated_at
before update on public.stripe_webhook_events
for each row
execute function public.set_updated_at();

alter table public.stripe_webhook_events enable row level security;

-- -----------------------------------------------------------------------------
-- 2. Subscription billing-state extensions
-- -----------------------------------------------------------------------------

alter table public.subscriptions
  add column stripe_price_id text,
  add column billing_interval text,
  add column stripe_status text,
  add column cancel_at_period_end boolean not null default false,
  add column canceled_at timestamptz,
  add column last_synchronized_at timestamptz;

alter table public.subscriptions
  add constraint subscriptions_billing_interval_check check (
    billing_interval is null or billing_interval in ('month', 'year')
  );

comment on column public.subscriptions.stripe_status is
  'Raw normalized Stripe subscription status from the provider.';

comment on column public.subscriptions.status is
  'IMMIFIN application subscription status.';

-- -----------------------------------------------------------------------------
-- 3. Atomic webhook event claim and completion helpers
-- -----------------------------------------------------------------------------

create or replace function public.sanitize_stripe_webhook_error_message(p_message text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      trim(replace(replace(coalesce(p_message, ''), E'\n', ' '), E'\r', ' ')),
      500
    ),
    ''
  );
$$;

create or replace function public.claim_stripe_webhook_event(
  p_stripe_event_id text,
  p_event_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.stripe_webhook_events;
  v_outcome text;
  v_stale_after interval := interval '10 minutes';
begin
  if nullif(trim(p_stripe_event_id), '') is null then
    raise exception 'stripe_event_id is required';
  end if;

  if nullif(trim(p_event_type), '') is null then
    raise exception 'event_type is required';
  end if;

  insert into public.stripe_webhook_events (
    stripe_event_id,
    event_type,
    status,
    attempt_count,
    processing_started_at,
    last_attempt_at
  )
  values (
    trim(p_stripe_event_id),
    trim(p_event_type),
    'processing',
    1,
    now(),
    now()
  )
  on conflict (stripe_event_id) do nothing
  returning * into v_event;

  if found then
    return jsonb_build_object(
      'outcome', 'claimed',
      'event', to_jsonb(v_event)
    );
  end if;

  select *
  into v_event
  from public.stripe_webhook_events
  where stripe_event_id = trim(p_stripe_event_id)
  for update;

  if not found then
    raise exception 'Stripe webhook event row missing after conflict';
  end if;

  if v_event.status = 'completed' then
    return jsonb_build_object(
      'outcome', 'already_completed',
      'event', to_jsonb(v_event)
    );
  end if;

  if v_event.status = 'processing'
     and v_event.processing_started_at is not null
     and v_event.processing_started_at > now() - v_stale_after then
    return jsonb_build_object(
      'outcome', 'in_progress',
      'event', to_jsonb(v_event)
    );
  end if;

  update public.stripe_webhook_events
  set
    event_type = trim(p_event_type),
    status = 'processing',
    attempt_count = v_event.attempt_count + 1,
    processing_started_at = now(),
    last_attempt_at = now(),
    error_message = null
  where id = v_event.id
  returning * into v_event;

  v_outcome := case
    when v_event.attempt_count <= 1 then 'claimed'
    else 'retry_claimed'
  end;

  return jsonb_build_object(
    'outcome', v_outcome,
    'event', to_jsonb(v_event)
  );
end;
$$;

create or replace function public.complete_stripe_webhook_event(
  p_stripe_event_id text
)
returns public.stripe_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.stripe_webhook_events;
begin
  if nullif(trim(p_stripe_event_id), '') is null then
    raise exception 'stripe_event_id is required';
  end if;

  update public.stripe_webhook_events
  set
    status = 'completed',
    processed_at = now(),
    error_message = null
  where stripe_event_id = trim(p_stripe_event_id)
  returning * into v_event;

  if not found then
    raise exception 'Stripe webhook event not found: %', p_stripe_event_id;
  end if;

  return v_event;
end;
$$;

create or replace function public.fail_stripe_webhook_event(
  p_stripe_event_id text,
  p_error_message text default null
)
returns public.stripe_webhook_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.stripe_webhook_events;
begin
  if nullif(trim(p_stripe_event_id), '') is null then
    raise exception 'stripe_event_id is required';
  end if;

  update public.stripe_webhook_events
  set
    status = 'failed',
    error_message = public.sanitize_stripe_webhook_error_message(p_error_message)
  where stripe_event_id = trim(p_stripe_event_id)
  returning * into v_event;

  if not found then
    raise exception 'Stripe webhook event not found: %', p_stripe_event_id;
  end if;

  return v_event;
end;
$$;
