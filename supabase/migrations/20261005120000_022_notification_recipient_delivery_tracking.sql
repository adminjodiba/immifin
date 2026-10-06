-- S6-NOTIFICATION-RETRY-003: Recipient-level delivery tracking and manual
-- failed-recipient recovery database foundation. This migration is additive:
-- it does not backfill historical campaigns or modify notification runtime.

-- -----------------------------------------------------------------------------
-- 1. Normalized recipient, recovery, and attempt vocabularies
-- -----------------------------------------------------------------------------

create type public.notification_original_eligibility_state as enum (
  'eligible',
  'excluded'
);

create type public.notification_recipient_delivery_state as enum (
  'audience_excluded',
  'eligible_pending',
  'attempt_in_progress',
  'provider_accepted',
  'failed_before_provider',
  'failed_provider',
  'submission_unknown',
  'skipped_ineligible'
);

create type public.notification_recovery_run_status as enum (
  'requested',
  'processing',
  'completed',
  'completed_with_failures'
);

create type public.notification_delivery_attempt_type as enum (
  'original',
  'retry'
);

create type public.notification_delivery_attempt_outcome as enum (
  'claimed',
  'provider_accepted',
  'failed_before_provider',
  'failed_provider',
  'skipped_ineligible',
  'submission_unknown'
);

-- -----------------------------------------------------------------------------
-- 2. Recipient tracking and recovery-operation tables
-- -----------------------------------------------------------------------------

create table public.notification_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.notification_campaigns (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  original_tier text,
  original_eligibility_state public.notification_original_eligibility_state not null,
  original_exclusion_reason text,
  original_evaluated_at timestamptz not null default now(),
  latest_delivery_state public.notification_recipient_delivery_state not null,
  latest_attempt_id uuid,
  accepted_at timestamptz,
  last_failure_code text,
  last_failure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_campaign_recipients_campaign_profile_unique unique (campaign_id, profile_id),
  constraint notification_campaign_recipients_original_tier_check check (
    original_tier is null or original_tier in ('pro', 'power')
  ),
  constraint notification_campaign_recipients_original_exclusion_reason_length_check check (
    original_exclusion_reason is null or char_length(original_exclusion_reason) between 1 and 100
  ),
  constraint notification_campaign_recipients_last_failure_code_length_check check (
    last_failure_code is null or char_length(last_failure_code) between 1 and 100
  ),
  constraint notification_campaign_recipients_original_state_projection_check check (
    (original_eligibility_state = 'eligible' and latest_delivery_state <> 'audience_excluded')
    or (
      original_eligibility_state = 'excluded'
      and latest_delivery_state = 'audience_excluded'
    )
  )
);

comment on table public.notification_campaign_recipients is
  'One evaluated stable profile identity per future tracked notification campaign. Historical campaigns are intentionally not backfilled.';

comment on column public.notification_campaign_recipients.profile_id is
  'Durable recipient identity. Email is resolved from profiles only when an attempt is made and is not stored here.';

comment on column public.notification_campaign_recipients.latest_delivery_state is
  'Convenience projection of the latest operational recipient state. Immutable delivery attempts remain authoritative evidence.';

create index notification_campaign_recipients_campaign_state_idx
  on public.notification_campaign_recipients (campaign_id, latest_delivery_state);

create index notification_campaign_recipients_profile_id_idx
  on public.notification_campaign_recipients (profile_id);

create trigger notification_campaign_recipients_set_updated_at
before update on public.notification_campaign_recipients
for each row
execute function public.set_updated_at();

create table public.notification_recovery_runs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.notification_campaigns (id) on delete restrict,
  status public.notification_recovery_run_status not null default 'requested',
  idempotency_key text not null,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  actor_clerk_user_id text not null,
  actor_email text not null,
  requested_at timestamptz not null default now(),
  processing_started_at timestamptz,
  completed_at timestamptz,
  attempted_recipient_count integer not null default 0,
  provider_accepted_count integer not null default 0,
  failed_before_provider_count integer not null default 0,
  failed_provider_count integer not null default 0,
  skipped_ineligible_count integer not null default 0,
  submission_unknown_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_recovery_runs_campaign_idempotency_key_unique unique (campaign_id, idempotency_key),
  constraint notification_recovery_runs_idempotency_key_length_check check (
    char_length(trim(idempotency_key)) between 1 and 200
  ),
  constraint notification_recovery_runs_actor_clerk_user_id_length_check check (
    char_length(trim(actor_clerk_user_id)) between 1 and 255
  ),
  constraint notification_recovery_runs_actor_email_length_check check (
    char_length(trim(actor_email)) between 1 and 320
  ),
  constraint notification_recovery_runs_counts_nonnegative_check check (
    attempted_recipient_count >= 0
    and provider_accepted_count >= 0
    and failed_before_provider_count >= 0
    and failed_provider_count >= 0
    and skipped_ineligible_count >= 0
    and submission_unknown_count >= 0
  ),
  constraint notification_recovery_runs_completed_at_check check (
    (status in ('requested', 'processing') and completed_at is null)
    or (status in ('completed', 'completed_with_failures') and completed_at is not null)
  )
);

comment on table public.notification_recovery_runs is
  'Manual-only failed-recipient recovery operation child of an original tracked campaign; not a second monthly campaign.';

comment on column public.notification_recovery_runs.actor_profile_id is
  'Nullable only when a profile is later deleted; Clerk and email actor snapshots preserve audit context.';

create unique index notification_recovery_runs_one_active_campaign_uidx
  on public.notification_recovery_runs (campaign_id)
  where status in ('requested', 'processing');

create index notification_recovery_runs_campaign_requested_at_idx
  on public.notification_recovery_runs (campaign_id, requested_at desc);

create trigger notification_recovery_runs_set_updated_at
before update on public.notification_recovery_runs
for each row
execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. Immutable/auditable delivery attempt ledger
-- -----------------------------------------------------------------------------

create table public.notification_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  campaign_recipient_id uuid not null references public.notification_campaign_recipients (id) on delete restrict,
  recovery_run_id uuid references public.notification_recovery_runs (id) on delete restrict,
  attempt_number integer not null,
  attempt_type public.notification_delivery_attempt_type not null,
  outcome public.notification_delivery_attempt_outcome not null default 'claimed',
  failure_stage text,
  reason_code text,
  reason_detail text,
  provider text,
  provider_message_id text,
  provider_submission_key text,
  tier_at_attempt text,
  attempted_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_delivery_attempts_recipient_attempt_number_unique unique (campaign_recipient_id, attempt_number),
  constraint notification_delivery_attempts_id_recipient_unique unique (id, campaign_recipient_id),
  constraint notification_delivery_attempts_recovery_recipient_unique unique nulls not distinct (recovery_run_id, campaign_recipient_id),
  constraint notification_delivery_attempts_attempt_number_positive_check check (attempt_number > 0),
  constraint notification_delivery_attempts_attempt_type_recovery_run_check check (
    (attempt_type = 'original' and recovery_run_id is null)
    or (attempt_type = 'retry' and recovery_run_id is not null)
  ),
  constraint notification_delivery_attempts_tier_at_attempt_check check (
    tier_at_attempt is null or tier_at_attempt in ('pro', 'power')
  ),
  constraint notification_delivery_attempts_failure_stage_length_check check (
    failure_stage is null or char_length(failure_stage) between 1 and 100
  ),
  constraint notification_delivery_attempts_reason_code_length_check check (
    reason_code is null or char_length(reason_code) between 1 and 100
  ),
  constraint notification_delivery_attempts_reason_detail_length_check check (
    reason_detail is null or char_length(reason_detail) between 1 and 1000
  ),
  constraint notification_delivery_attempts_provider_length_check check (
    provider is null or char_length(provider) between 1 and 100
  ),
  constraint notification_delivery_attempts_provider_message_id_length_check check (
    provider_message_id is null or char_length(provider_message_id) between 1 and 255
  ),
  constraint notification_delivery_attempts_provider_submission_key_length_check check (
    provider_submission_key is null or char_length(provider_submission_key) between 1 and 255
  ),
  constraint notification_delivery_attempts_completed_at_check check (
    (outcome = 'claimed' and completed_at is null)
    or (outcome <> 'claimed' and completed_at is not null)
  )
);

comment on table public.notification_delivery_attempts is
  'Append-only operational delivery-attempt ledger. Rendered message bodies, email identity, provider secrets, raw payloads, and stack traces are intentionally not stored.';

comment on column public.notification_delivery_attempts.provider_message_id is
  'Provider operational metadata only. A Resend email ID records provider acceptance, not inbox delivery.';

comment on column public.notification_delivery_attempts.provider_submission_key is
  'Stable opaque provider idempotency key for a future provider integration; no provider call is made by this migration.';

create index notification_delivery_attempts_recipient_attempted_at_idx
  on public.notification_delivery_attempts (campaign_recipient_id, attempted_at desc);

create index notification_delivery_attempts_recovery_run_outcome_idx
  on public.notification_delivery_attempts (recovery_run_id, outcome);

create index notification_delivery_attempts_provider_message_id_idx
  on public.notification_delivery_attempts (provider, provider_message_id)
  where provider_message_id is not null;

alter table public.notification_campaign_recipients
  add constraint notification_campaign_recipients_latest_attempt_fk
  foreign key (latest_attempt_id, id)
  references public.notification_delivery_attempts (id, campaign_recipient_id)
  on delete restrict;

-- Terminal attempt evidence must not be changed or deleted. A claimed attempt can
-- only be transitioned once to a terminal outcome by the finalize RPC below.
create or replace function public.guard_notification_delivery_attempt_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'notification delivery attempts are immutable and cannot be deleted';
  end if;

  if old.outcome <> 'claimed' then
    raise exception 'terminal notification delivery attempts are immutable';
  end if;

  if new.id <> old.id
     or new.campaign_recipient_id <> old.campaign_recipient_id
     or new.recovery_run_id is distinct from old.recovery_run_id
     or new.attempt_number <> old.attempt_number
     or new.attempt_type <> old.attempt_type
     or new.provider_submission_key is distinct from old.provider_submission_key
     or new.tier_at_attempt is distinct from old.tier_at_attempt
     or new.attempted_at <> old.attempted_at
     or new.created_at <> old.created_at then
    raise exception 'claimed notification delivery attempt identity is immutable';
  end if;

  if new.outcome = 'claimed' or new.completed_at is null then
    raise exception 'claimed notification delivery attempt must be finalized to a terminal outcome';
  end if;

  return new;
end;
$$;

create trigger notification_delivery_attempts_immutable
before update or delete on public.notification_delivery_attempts
for each row
execute function public.guard_notification_delivery_attempt_mutation();

-- -----------------------------------------------------------------------------
-- 4. Safe bounded diagnostic normalization
-- -----------------------------------------------------------------------------

create or replace function public.sanitize_notification_delivery_reason_detail(p_detail text)
returns text
language sql
immutable
as $$
  select nullif(
    left(
      trim(replace(replace(coalesce(p_detail, ''), E'\n', ' '), E'\r', ' ')),
      1000
    ),
    ''
  );
$$;

-- -----------------------------------------------------------------------------
-- 5. Manual recovery concurrency primitives
-- -----------------------------------------------------------------------------

create or replace function public.create_or_claim_notification_recovery_run(
  p_campaign_id uuid,
  p_idempotency_key text,
  p_actor_profile_id uuid,
  p_actor_clerk_user_id text,
  p_actor_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.notification_campaigns;
  v_recovery_run public.notification_recovery_runs;
begin
  if p_campaign_id is null then
    raise exception 'campaign_id is required';
  end if;

  if nullif(trim(p_idempotency_key), '') is null then
    raise exception 'idempotency_key is required';
  end if;

  if nullif(trim(p_actor_clerk_user_id), '') is null then
    raise exception 'actor_clerk_user_id is required';
  end if;

  if nullif(trim(p_actor_email), '') is null then
    raise exception 'actor_email is required';
  end if;

  -- Lock the parent first: this serializes recovery creation per campaign before
  -- the partial active-run unique index provides a final concurrency backstop.
  select *
  into v_campaign
  from public.notification_campaigns
  where id = p_campaign_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'campaign_not_found');
  end if;

  select *
  into v_recovery_run
  from public.notification_recovery_runs
  where campaign_id = p_campaign_id
    and idempotency_key = trim(p_idempotency_key)
  for update;

  if found then
    return jsonb_build_object(
      'outcome', 'idempotent',
      'recovery_run', to_jsonb(v_recovery_run)
    );
  end if;

  if v_campaign.campaign_type <> 'monthly_immigration_update'
     or v_campaign.status not in ('completed', 'completed_with_failures') then
    return jsonb_build_object('outcome', 'campaign_not_recoverable');
  end if;

  -- Recipient evidence is mandatory. A campaign without rows is legacy and can
  -- never become retryable from aggregate counters alone.
  if not exists (
    select 1
    from public.notification_campaign_recipients
    where campaign_id = p_campaign_id
  ) then
    return jsonb_build_object('outcome', 'legacy_campaign');
  end if;

  if not exists (
    select 1
    from public.notification_campaign_recipients
    where campaign_id = p_campaign_id
      and latest_delivery_state in ('failed_before_provider', 'failed_provider')
  ) then
    return jsonb_build_object('outcome', 'no_retryable_recipients');
  end if;

  select *
  into v_recovery_run
  from public.notification_recovery_runs
  where campaign_id = p_campaign_id
    and status in ('requested', 'processing')
  for update;

  if found then
    return jsonb_build_object(
      'outcome', 'active_recovery_exists',
      'recovery_run', to_jsonb(v_recovery_run)
    );
  end if;

  insert into public.notification_recovery_runs (
    campaign_id,
    status,
    idempotency_key,
    actor_profile_id,
    actor_clerk_user_id,
    actor_email,
    requested_at
  )
  values (
    p_campaign_id,
    'requested',
    trim(p_idempotency_key),
    p_actor_profile_id,
    trim(p_actor_clerk_user_id),
    trim(p_actor_email),
    now()
  )
  returning * into v_recovery_run;

  return jsonb_build_object(
    'outcome', 'claimed',
    'recovery_run', to_jsonb(v_recovery_run)
  );
end;
$$;

create or replace function public.claim_notification_recovery_recipient_attempt(
  p_recovery_run_id uuid,
  p_campaign_recipient_id uuid,
  p_provider text default null,
  p_provider_submission_key text default null,
  p_tier_at_attempt text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recovery_run public.notification_recovery_runs;
  v_recipient public.notification_campaign_recipients;
  v_existing_attempt public.notification_delivery_attempts;
  v_attempt public.notification_delivery_attempts;
  v_attempt_number integer;
begin
  if p_recovery_run_id is null then
    raise exception 'recovery_run_id is required';
  end if;

  if p_campaign_recipient_id is null then
    raise exception 'campaign_recipient_id is required';
  end if;

  if p_tier_at_attempt is not null and trim(p_tier_at_attempt) not in ('pro', 'power') then
    raise exception 'tier_at_attempt must be pro or power when supplied';
  end if;

  select *
  into v_recovery_run
  from public.notification_recovery_runs
  where id = p_recovery_run_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'recovery_run_not_found');
  end if;

  if v_recovery_run.status not in ('requested', 'processing') then
    return jsonb_build_object(
      'outcome', 'recovery_run_not_active',
      'recovery_run', to_jsonb(v_recovery_run)
    );
  end if;

  select *
  into v_recipient
  from public.notification_campaign_recipients
  where id = p_campaign_recipient_id
    and campaign_id = v_recovery_run.campaign_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'recipient_not_in_campaign');
  end if;

  select *
  into v_existing_attempt
  from public.notification_delivery_attempts
  where recovery_run_id = p_recovery_run_id
    and campaign_recipient_id = p_campaign_recipient_id;

  if found then
    return jsonb_build_object(
      'outcome', case when v_existing_attempt.outcome = 'claimed'
        then 'already_claimed'
        else 'already_finalized_for_recovery'
      end,
      'attempt', to_jsonb(v_existing_attempt)
    );
  end if;

  if v_recipient.latest_delivery_state = 'provider_accepted' then
    return jsonb_build_object('outcome', 'already_provider_accepted');
  end if;

  if v_recipient.latest_delivery_state = 'attempt_in_progress' then
    return jsonb_build_object('outcome', 'already_claimed');
  end if;

  if v_recipient.latest_delivery_state not in ('failed_before_provider', 'failed_provider') then
    return jsonb_build_object('outcome', 'not_retryable');
  end if;

  select coalesce(max(attempt_number), 0) + 1
  into v_attempt_number
  from public.notification_delivery_attempts
  where campaign_recipient_id = p_campaign_recipient_id;

  insert into public.notification_delivery_attempts (
    campaign_recipient_id,
    recovery_run_id,
    attempt_number,
    attempt_type,
    outcome,
    provider,
    provider_submission_key,
    tier_at_attempt,
    attempted_at
  )
  values (
    p_campaign_recipient_id,
    p_recovery_run_id,
    v_attempt_number,
    'retry',
    'claimed',
    nullif(trim(p_provider), ''),
    nullif(trim(p_provider_submission_key), ''),
    nullif(trim(p_tier_at_attempt), ''),
    now()
  )
  returning * into v_attempt;

  update public.notification_campaign_recipients
  set
    latest_delivery_state = 'attempt_in_progress',
    latest_attempt_id = v_attempt.id
  where id = v_recipient.id
  returning * into v_recipient;

  update public.notification_recovery_runs
  set
    status = 'processing',
    processing_started_at = coalesce(processing_started_at, now())
  where id = v_recovery_run.id
  returning * into v_recovery_run;

  return jsonb_build_object(
    'outcome', 'claimed',
    'attempt', to_jsonb(v_attempt),
    'recipient', to_jsonb(v_recipient),
    'recovery_run', to_jsonb(v_recovery_run)
  );
end;
$$;

create or replace function public.finalize_notification_delivery_attempt(
  p_delivery_attempt_id uuid,
  p_outcome public.notification_delivery_attempt_outcome,
  p_failure_stage text default null,
  p_reason_code text default null,
  p_reason_detail text default null,
  p_provider text default null,
  p_provider_message_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.notification_delivery_attempts;
  v_recipient public.notification_campaign_recipients;
begin
  if p_delivery_attempt_id is null then
    raise exception 'delivery_attempt_id is required';
  end if;

  if p_outcome is null or p_outcome = 'claimed' then
    raise exception 'a terminal delivery attempt outcome is required';
  end if;

  select *
  into v_attempt
  from public.notification_delivery_attempts
  where id = p_delivery_attempt_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'attempt_not_found');
  end if;

  if v_attempt.outcome <> 'claimed' then
    return jsonb_build_object(
      'outcome', 'already_finalized',
      'attempt', to_jsonb(v_attempt)
    );
  end if;

  update public.notification_delivery_attempts
  set
    outcome = p_outcome,
    failure_stage = nullif(trim(p_failure_stage), ''),
    reason_code = nullif(trim(p_reason_code), ''),
    reason_detail = public.sanitize_notification_delivery_reason_detail(p_reason_detail),
    provider = coalesce(nullif(trim(p_provider), ''), provider),
    provider_message_id = nullif(trim(p_provider_message_id), ''),
    completed_at = now()
  where id = v_attempt.id
  returning * into v_attempt;

  update public.notification_campaign_recipients
  set
    latest_delivery_state = v_attempt.outcome::text::public.notification_recipient_delivery_state,
    latest_attempt_id = v_attempt.id,
    accepted_at = case
      when v_attempt.outcome = 'provider_accepted' then v_attempt.completed_at
      else accepted_at
    end,
    last_failure_code = case
      when v_attempt.outcome in ('failed_before_provider', 'failed_provider')
        then v_attempt.reason_code
      else null
    end,
    last_failure_at = case
      when v_attempt.outcome in ('failed_before_provider', 'failed_provider')
        then v_attempt.completed_at
      else null
    end
  where id = v_attempt.campaign_recipient_id
  returning * into v_recipient;

  return jsonb_build_object(
    'outcome', 'finalized',
    'attempt', to_jsonb(v_attempt),
    'recipient', to_jsonb(v_recipient)
  );
end;
$$;

create or replace function public.complete_notification_recovery_run(
  p_recovery_run_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recovery_run public.notification_recovery_runs;
  v_claimed_count integer;
  v_attempted_recipient_count integer;
  v_provider_accepted_count integer;
  v_failed_before_provider_count integer;
  v_failed_provider_count integer;
  v_skipped_ineligible_count integer;
  v_submission_unknown_count integer;
begin
  if p_recovery_run_id is null then
    raise exception 'recovery_run_id is required';
  end if;

  select *
  into v_recovery_run
  from public.notification_recovery_runs
  where id = p_recovery_run_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'recovery_run_not_found');
  end if;

  if v_recovery_run.status in ('completed', 'completed_with_failures') then
    return jsonb_build_object(
      'outcome', 'already_completed',
      'recovery_run', to_jsonb(v_recovery_run)
    );
  end if;

  select
    count(*) filter (where outcome = 'claimed'),
    count(*),
    count(*) filter (where outcome = 'provider_accepted'),
    count(*) filter (where outcome = 'failed_before_provider'),
    count(*) filter (where outcome = 'failed_provider'),
    count(*) filter (where outcome = 'skipped_ineligible'),
    count(*) filter (where outcome = 'submission_unknown')
  into
    v_claimed_count,
    v_attempted_recipient_count,
    v_provider_accepted_count,
    v_failed_before_provider_count,
    v_failed_provider_count,
    v_skipped_ineligible_count,
    v_submission_unknown_count
  from public.notification_delivery_attempts
  where recovery_run_id = p_recovery_run_id;

  if v_claimed_count > 0 then
    return jsonb_build_object(
      'outcome', 'attempts_still_claimed',
      'claimed_attempt_count', v_claimed_count
    );
  end if;

  update public.notification_recovery_runs
  set
    status = case
      when v_failed_before_provider_count > 0
        or v_failed_provider_count > 0
        or v_submission_unknown_count > 0
        then 'completed_with_failures'::public.notification_recovery_run_status
      else 'completed'::public.notification_recovery_run_status
    end,
    processing_started_at = coalesce(processing_started_at, now()),
    completed_at = now(),
    attempted_recipient_count = v_attempted_recipient_count,
    provider_accepted_count = v_provider_accepted_count,
    failed_before_provider_count = v_failed_before_provider_count,
    failed_provider_count = v_failed_provider_count,
    skipped_ineligible_count = v_skipped_ineligible_count,
    submission_unknown_count = v_submission_unknown_count
  where id = v_recovery_run.id
  returning * into v_recovery_run;

  return jsonb_build_object(
    'outcome', 'completed',
    'recovery_run', to_jsonb(v_recovery_run)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. RLS — server/service-role only, no client policies
-- -----------------------------------------------------------------------------

alter table public.notification_campaign_recipients enable row level security;
alter table public.notification_delivery_attempts enable row level security;
alter table public.notification_recovery_runs enable row level security;

-- Authorized future Admin APIs call these functions through the server-side
-- service-role architecture. Ordinary authenticated users receive no policies
-- and cannot read or mutate recipient operational history directly.
revoke execute on function public.create_or_claim_notification_recovery_run(uuid, text, uuid, text, text) from public;
revoke execute on function public.claim_notification_recovery_recipient_attempt(uuid, uuid, text, text, text) from public;
revoke execute on function public.finalize_notification_delivery_attempt(uuid, public.notification_delivery_attempt_outcome, text, text, text, text, text) from public;
revoke execute on function public.complete_notification_recovery_run(uuid) from public;

grant execute on function public.create_or_claim_notification_recovery_run(uuid, text, uuid, text, text) to service_role;
grant execute on function public.claim_notification_recovery_recipient_attempt(uuid, uuid, text, text, text) to service_role;
grant execute on function public.finalize_notification_delivery_attempt(uuid, public.notification_delivery_attempt_outcome, text, text, text, text, text) to service_role;
grant execute on function public.complete_notification_recovery_run(uuid) to service_role;