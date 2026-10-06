import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const trackingMigrationPath =
  "supabase/migrations/20261005120000_022_notification_recipient_delivery_tracking.sql";
const originalClaimMigrationPath =
  "supabase/migrations/20261005130000_023_notification_original_delivery_attempt_claim.sql";

function recoveryClaimSource(source: string): string {
  const start = source.indexOf(
    "create or replace function public.claim_notification_recovery_recipient_attempt(",
  );
  const end = source.indexOf(
    "create or replace function public.finalize_notification_delivery_attempt(",
  );
  assert.notEqual(start, -1, "recovery claim primitive must exist");
  assert.notEqual(end, -1, "recovery claim primitive boundary must exist");
  return source.slice(start, end);
}

describe("notification recovery retry-claim primitive", () => {
  it("owns retry attempt and provider idempotency identity atomically", () => {
    const trackingMigration = readFileSync(trackingMigrationPath, "utf8");
    const recoveryClaim = recoveryClaimSource(trackingMigration);

    assert.match(
      recoveryClaim,
      /claim_notification_recovery_recipient_attempt\(\s*p_recovery_run_id uuid,\s*p_campaign_recipient_id uuid,\s*p_provider text default null,\s*p_tier_at_attempt text default null\s*\)/,
    );
    assert.doesNotMatch(recoveryClaim, /p_provider_submission_key/);
    assert.match(recoveryClaim, /v_attempt_id uuid := gen_random_uuid\(\);/);
    assert.match(
      recoveryClaim,
      /v_provider_submission_key text := 'immifin-notification-attempt:' \|\| v_attempt_id::text;/,
    );
    assert.match(
      recoveryClaim,
      /insert into public\.notification_delivery_attempts \(\s*id,\s*campaign_recipient_id,/,
    );
    assert.match(
      recoveryClaim,
      /values \(\s*v_attempt_id,\s*p_campaign_recipient_id,\s*p_recovery_run_id,\s*v_attempt_number,\s*'retry',\s*'claimed',\s*nullif\(trim\(p_provider\), ''\),\s*v_provider_submission_key,/,
    );
    assert.match(
      recoveryClaim,
      /'outcome', 'claimed',\s*'attempt', to_jsonb\(v_attempt\)/,
    );
  });

  it("preserves recovery concurrency and explicit-failure-only guards", () => {
    const trackingMigration = readFileSync(trackingMigrationPath, "utf8");
    const recoveryClaim = recoveryClaimSource(trackingMigration);

    assert.match(
      trackingMigration,
      /notification_recovery_runs_one_active_campaign_uidx[\s\S]*status in \('requested', 'processing'\)/,
    );
    assert.match(
      trackingMigration,
      /notification_delivery_attempts_recovery_recipient_unique unique nulls not distinct \(recovery_run_id, campaign_recipient_id\)/,
    );
    assert.match(recoveryClaim, /where id = p_campaign_recipient_id\s*and campaign_id = v_recovery_run\.campaign_id\s*for update;/);
    assert.match(recoveryClaim, /latest_delivery_state = 'provider_accepted'/);
    assert.match(
      recoveryClaim,
      /latest_delivery_state not in \('failed_before_provider', 'failed_provider'\)/,
    );
    assert.match(recoveryClaim, /attempt_type,\s*outcome,/);
    assert.match(recoveryClaim, /'retry',\s*'claimed'/);
  });

  it("keeps the original database-owned claim primitive intact", () => {
    const originalClaimMigration = readFileSync(originalClaimMigrationPath, "utf8");

    assert.match(originalClaimMigration, /v_attempt_id uuid := gen_random_uuid\(\);/);
    assert.match(
      originalClaimMigration,
      /v_provider_submission_key text := 'immifin-notification-attempt:' \|\| v_attempt_id::text;/,
    );
    assert.match(originalClaimMigration, /'original',\s*'claimed'/);
    assert.match(originalClaimMigration, /recovery_run_id,[\s\S]*null,/);
  });
});