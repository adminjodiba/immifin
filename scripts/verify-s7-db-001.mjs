/**
 * S7-DB-001 database verification script.
 * Run after applying migration 20260712120000_018_stripe_webhook_foundation.sql:
 *   node scripts/verify-s7-db-001.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testEventPrefix = `evt_test_s7_db_001_${Date.now()}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifySchema() {
  const { error: tableError } = await supabase.from("stripe_webhook_events").select("id").limit(1);
  assert(!tableError, `stripe_webhook_events missing or inaccessible: ${tableError?.message}`);

  const { data: subscriptionSample, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      "stripe_price_id,billing_interval,stripe_status,cancel_at_period_end,canceled_at,last_synchronized_at",
    )
    .limit(1);

  assert(!subscriptionError, `subscriptions extensions missing: ${subscriptionError?.message}`);
  assert(
    subscriptionSample !== null,
    "subscriptions query returned null data unexpectedly",
  );
}

async function verifyConstraints() {
  const duplicateEventId = `${testEventPrefix}_duplicate`;

  const firstInsert = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: duplicateEventId,
    event_type: "test.event",
    status: "received",
  });

  assert(!firstInsert.error, `initial insert failed: ${firstInsert.error?.message}`);

  const duplicateInsert = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: duplicateEventId,
    event_type: "test.event",
    status: "received",
  });

  assert(duplicateInsert.error, "expected duplicate stripe_event_id to be rejected");

  const invalidStatus = await supabase.from("stripe_webhook_events").insert({
    stripe_event_id: `${testEventPrefix}_bad_status`,
    event_type: "test.event",
    status: "bogus",
  });

  assert(invalidStatus.error, "expected unsupported ledger status to be rejected");

  const validInterval = await supabase
    .from("subscriptions")
    .select("id, profile_id")
    .limit(1)
    .maybeSingle();

  if (validInterval.data?.id) {
    const monthUpdate = await supabase
      .from("subscriptions")
      .update({ billing_interval: "month" })
      .eq("id", validInterval.data.id);

    assert(!monthUpdate.error, `month billing_interval rejected: ${monthUpdate.error?.message}`);

    const invalidInterval = await supabase
      .from("subscriptions")
      .update({ billing_interval: "monthly" })
      .eq("id", validInterval.data.id);

    assert(invalidInterval.error, "expected unsupported billing_interval monthly to be rejected");

    await supabase
      .from("subscriptions")
      .update({ billing_interval: null })
      .eq("id", validInterval.data.id);
  }
}

async function verifyClaimFlow() {
  const eventId = `${testEventPrefix}_claim`;

  const firstClaim = await supabase.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: eventId,
    p_event_type: "customer.subscription.updated",
  });

  assert(!firstClaim.error, `first claim failed: ${firstClaim.error?.message}`);
  assert(firstClaim.data?.outcome === "claimed", `expected claimed, got ${firstClaim.data?.outcome}`);

  const duplicateCompleted = await supabase.rpc("complete_stripe_webhook_event", {
    p_stripe_event_id: eventId,
  });
  assert(!duplicateCompleted.error, `complete failed: ${duplicateCompleted.error?.message}`);

  const alreadyCompleted = await supabase.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: eventId,
    p_event_type: "customer.subscription.updated",
  });

  assert(
    alreadyCompleted.data?.outcome === "already_completed",
    `expected already_completed, got ${alreadyCompleted.data?.outcome}`,
  );

  const retryEventId = `${testEventPrefix}_retry`;

  const retryClaim = await supabase.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: retryEventId,
    p_event_type: "customer.subscription.updated",
  });
  assert(!retryClaim.error, `retry claim setup failed: ${retryClaim.error?.message}`);

  const retryFail = await supabase.rpc("fail_stripe_webhook_event", {
    p_stripe_event_id: retryEventId,
    p_error_message: "safe test failure",
  });
  assert(!retryFail.error, `retry fail failed: ${retryFail.error?.message}`);

  const retryClaimAgain = await supabase.rpc("claim_stripe_webhook_event", {
    p_stripe_event_id: retryEventId,
    p_event_type: "customer.subscription.updated",
  });
  assert(
    retryClaimAgain.data?.outcome === "retry_claimed",
    `expected retry_claimed, got ${retryClaimAgain.data?.outcome}`,
  );

  const concurrentEventId = `${testEventPrefix}_concurrent`;

  const [claimA, claimB] = await Promise.all([
    supabase.rpc("claim_stripe_webhook_event", {
      p_stripe_event_id: concurrentEventId,
      p_event_type: "checkout.session.completed",
    }),
    supabase.rpc("claim_stripe_webhook_event", {
      p_stripe_event_id: concurrentEventId,
      p_event_type: "checkout.session.completed",
    }),
  ]);

  assert(!claimA.error && !claimB.error, "concurrent claims returned errors");

  const outcomes = [claimA.data?.outcome, claimB.data?.outcome].sort();
  const hasClaimed = outcomes.includes("claimed");
  const hasInProgressOrCompleted =
    outcomes.includes("in_progress") || outcomes.includes("claimed");

  assert(hasClaimed, `expected one claimed outcome, got ${outcomes.join(",")}`);
  assert(hasInProgressOrCompleted, `unexpected concurrent outcomes: ${outcomes.join(",")}`);
}

async function cleanup() {
  await supabase
    .from("stripe_webhook_events")
    .delete()
    .like("stripe_event_id", `${testEventPrefix}%`);
}

async function main() {
  try {
    await verifySchema();
    console.log("✓ schema verification passed");

    await verifyConstraints();
    console.log("✓ constraint verification passed");

    await verifyClaimFlow();
    console.log("✓ claim / retry / concurrent verification passed");
  } finally {
    await cleanup();
    console.log("✓ test cleanup completed");
  }
}

main().catch((error) => {
  console.error("✗ verification failed:", error.message);
  process.exit(1);
});
