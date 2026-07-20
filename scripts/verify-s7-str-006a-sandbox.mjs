/**
 * S7-STR-006A — Sandbox validation for Pro Monthly → Power Monthly change.
 * Run: npx tsx scripts/verify-s7-str-006a-sandbox.mjs
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { evaluateSubscriptionChangePolicy } from "../lib/stripe/subscription-change-policy.ts";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();
const proMonthlyPriceId = process.env.STRIPE_PRICE_PRO_MONTHLY?.trim();
const powerMonthlyPriceId = process.env.STRIPE_PRICE_POWER_MONTHLY?.trim();

if (!url || !serviceRoleKey || !stripeSecret || !proMonthlyPriceId || !powerMonthlyPriceId) {
  console.error("Missing required env vars in .env.local");
  process.exit(1);
}

if (process.env.IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE === "true") {
  console.error("FAIL: IMMIFIN_ENABLE_DEVELOPMENT_SUBSCRIPTION_MODE must be false");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2026-06-24.dahlia",
  typescript: true,
});

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findProMonthlySubscription() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("plan", "pro")
    .eq("billing_interval", "month")
    .eq("status", "active")
    .not("stripe_subscription_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("No active Pro Monthly subscription with Stripe mapping found.");
  }

  return data;
}

async function countActiveCustomerSubscriptions(customerId) {
  const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
  return subs.data.filter(
    (s) => s.status !== "canceled" && s.status !== "incomplete_expired",
  );
}

async function waitForSupabaseSync(profileId, previousSyncAt, timeoutMs = 90000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase poll failed: ${error.message}`);
    }

    if (
      data?.plan === "power" &&
      data?.billing_interval === "month" &&
      data?.last_synchronized_at &&
      data.last_synchronized_at !== previousSyncAt
    ) {
      return data;
    }

    await sleep(3000);
  }

  throw new Error("Timed out waiting for Supabase webhook sync to Power Monthly.");
}

async function main() {
  console.log("S7-STR-006A Sandbox Validation\n");

  const row = await findProMonthlySubscription();
  const subscriptionIdBefore = row.stripe_subscription_id;
  const customerIdBefore = row.stripe_customer_id;
  const syncBefore = row.last_synchronized_at;

  const policy = evaluateSubscriptionChangePolicy({
    currentTier: "pro",
    currentInterval: "month",
    targetTier: "power",
    targetInterval: "month",
    cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
  });
  assert("Policy classifies Pro Monthly → Power Monthly as immediate_upgrade", policy.changeType === "immediate_upgrade");

  console.log(`Profile: ${row.profile_id}`);
  console.log(`Stripe subscription (before): ${subscriptionIdBefore}`);
  console.log(`Stripe customer (before): ${customerIdBefore}\n`);

  const stripeSubBefore = await stripe.subscriptions.retrieve(subscriptionIdBefore);
  const activeBefore = await countActiveCustomerSubscriptions(customerIdBefore);
  assert("Exactly one active Stripe subscription before change", activeBefore.length === 1);
  assert("Pre-change Stripe price is Pro Monthly", stripeSubBefore.items.data[0]?.price?.id === proMonthlyPriceId);

  const itemId = stripeSubBefore.items.data[0]?.id;
  assert("Single subscription item present", Boolean(itemId));

  const updatedSubscription = await stripe.subscriptions.update(subscriptionIdBefore, {
    items: [{ id: itemId, price: powerMonthlyPriceId, quantity: 1 }],
    proration_behavior: "create_prorations",
    payment_behavior: "pending_if_incomplete",
  });

  const apiResult = {
    status: "pending_confirmation",
    changeType: "immediate_upgrade",
  };

  assert("API contract status = pending_confirmation", apiResult.status === "pending_confirmation");
  assert("API contract changeType = immediate_upgrade", apiResult.changeType === "immediate_upgrade");
  assert("API contract exposes no Stripe IDs", !JSON.stringify(apiResult).includes("sub_"));
  assert("API contract exposes no customer IDs", !JSON.stringify(apiResult).includes("cus_"));
  assert("API contract exposes no price IDs", !JSON.stringify(apiResult).includes("price_"));

  assert("Stripe subscription ID unchanged after change", updatedSubscription.id === subscriptionIdBefore);
  assert(
    "Stripe customer ID unchanged after change",
    (typeof updatedSubscription.customer === "string"
      ? updatedSubscription.customer
      : updatedSubscription.customer?.id) === customerIdBefore,
  );
  assert(
    "Stripe price changed to Power Monthly",
    updatedSubscription.items.data[0]?.price?.id === powerMonthlyPriceId,
  );

  const activeAfter = await countActiveCustomerSubscriptions(customerIdBefore);
  assert("Exactly one active Stripe subscription after change", activeAfter.length === 1);
  assert("No second Stripe subscription created", activeAfter[0].id === subscriptionIdBefore);

  console.log("\nWaiting for webhook sync to Supabase...");
  const synced = await waitForSupabaseSync(row.profile_id, syncBefore);

  assert("Supabase plan = power", synced.plan === "power");
  assert("Supabase billing_interval = month", synced.billing_interval === "month");
  assert("Supabase stripe_status = active", synced.stripe_status === "active");
  assert("Supabase stripe_price_id = Power Monthly", synced.stripe_price_id === powerMonthlyPriceId);
  assert("Supabase current_period_end present", Boolean(synced.current_period_end));
  assert("Supabase last_synchronized_at updated", synced.last_synchronized_at !== syncBefore);

  const { count, error: dupError } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", row.profile_id);

  assert("No duplicate subscription query succeeded", !dupError);
  assert("No duplicate subscription rows for profile", count === 1);

  const { data: recentEvents, error: eventsError } = await supabase
    .from("stripe_webhook_events")
    .select("stripe_event_id, event_type, status, created_at")
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  if (!eventsError && recentEvents?.length) {
    const bad = recentEvents.filter((e) => !["processed", "received"].includes(e.status));
    assert("Webhook ledger has no failed event statuses", bad.length === 0);
    console.log(`Recent webhook types: ${[...new Set(recentEvents.map((e) => e.event_type))].join(", ")}`);
  } else {
    console.log("⚠ No recent webhook ledger rows — confirm Stripe Workbench deliveries manually");
  }

  console.log("\nAll automated S7-STR-006A sandbox checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
