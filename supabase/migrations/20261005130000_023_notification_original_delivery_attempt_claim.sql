-- S6-NOTIFICATION-RETRY-004: Atomic original-send attempt claim.
--
-- The recipient-delivery foundation deliberately shipped only recovery claims.
-- Original sends need an equivalent server-side primitive so application code
-- never performs an unsafe select-then-insert before a provider submission.

create or replace function public.claim_notification_original_recipient_attempt(
  p_campaign_recipient_id uuid,
  p_provider text default null,
  p_tier_at_attempt text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.notification_campaign_recipients;
  v_existing_attempt public.notification_delivery_attempts;
  v_attempt public.notification_delivery_attempts;
  v_attempt_id uuid := gen_random_uuid();
  v_provider_submission_key text := 'immifin-notification-attempt:' || v_attempt_id::text;
begin
  if p_campaign_recipient_id is null then
    raise exception 'campaign_recipient_id is required';
  end if;

  select *
  into v_recipient
  from public.notification_campaign_recipients
  where id = p_campaign_recipient_id
  for update;

  if not found then
    return jsonb_build_object('outcome', 'recipient_not_found');
  end if;

  if v_recipient.original_eligibility_state <> 'eligible' then
    return jsonb_build_object('outcome', 'not_originally_eligible');
  end if;

  select *
  into v_existing_attempt
  from public.notification_delivery_attempts
  where campaign_recipient_id = v_recipient.id
    and attempt_type = 'original'
  for update;

  if found then
    return jsonb_build_object(
      'outcome', case
        when v_existing_attempt.outcome = 'claimed' then 'already_claimed'
        when v_existing_attempt.outcome = 'provider_accepted' then 'already_provider_accepted'
        else 'already_finalized'
      end,
      'attempt', to_jsonb(v_existing_attempt),
      'recipient', to_jsonb(v_recipient)
    );
  end if;

  insert into public.notification_delivery_attempts (
    id,
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
    v_attempt_id,
    v_recipient.id,
    null,
    1,
    'original',
    'claimed',
    nullif(trim(p_provider), ''),
    v_provider_submission_key,
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

  return jsonb_build_object(
    'outcome', 'claimed',
    'attempt', to_jsonb(v_attempt),
    'recipient', to_jsonb(v_recipient)
  );
end;
$$;

revoke execute on function public.claim_notification_original_recipient_attempt(uuid, text, text) from public;
revoke execute on function public.claim_notification_original_recipient_attempt(uuid, text, text) from anon;
revoke execute on function public.claim_notification_original_recipient_attempt(uuid, text, text) from authenticated;
grant execute on function public.claim_notification_original_recipient_attempt(uuid, text, text) to service_role;