/**
 * S7A-DS2-FEEDBACK-HISTORY-006A — Feedback history + API verification.
 * Run: npx tsx scripts/verify-s7a-ds2-feedback-api-003.mjs
 *
 * Local helpers + source checks only. Does not apply migrations or call remote Supabase.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PUBLIC_ROUTE_PATTERNS } from "../lib/auth/publicRoutes.ts";
import {
  decideFeedbackWrite,
  FEEDBACK_THROTTLE_ERROR,
  FEEDBACK_UPDATE_THROTTLE_MS,
  isPubliclyVisibleFeedback,
  toPublishedUserFeedback,
} from "../lib/feedback/feedbackRules.ts";
import {
  FEEDBACK_VALIDATION_ERROR,
  resolvePublicDisplayName,
  validateFeedbackSubmission,
} from "../lib/feedback/feedbackValidation.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function readSource(relPath) {
  return readFileSync(resolve(relPath), "utf8");
}

const validSubmission = {
  rating: 5,
  feedbackText: "This product helped me plan my next step.",
  displayName: "Samar P.",
  publicationPermission: true,
};

const now = new Date("2026-09-12T18:00:00.000Z");
const olderThanThrottle = new Date(now.getTime() - FEEDBACK_UPDATE_THROTTLE_MS - 1).toISOString();
const withinThrottle = new Date(now.getTime() - FEEDBACK_UPDATE_THROTTLE_MS + 60_000).toISOString();

function main() {
  assert("valid first payload", validateFeedbackSubmission(validSubmission).ok === true);
  assert("invalid rating 0", validateFeedbackSubmission({ ...validSubmission, rating: 0 }).ok === false);
  assert("invalid rating 6", validateFeedbackSubmission({ ...validSubmission, rating: 6 }).ok === false);
  assert("invalid rating float", validateFeedbackSubmission({ ...validSubmission, rating: 3.5 }).ok === false);
  assert("feedback <10", validateFeedbackSubmission({ ...validSubmission, feedbackText: "too short" }).ok === false);
  assert("feedback >1000", validateFeedbackSubmission({ ...validSubmission, feedbackText: "x".repeat(1001) }).ok === false);
  assert("feedback =10", validateFeedbackSubmission({ ...validSubmission, feedbackText: "x".repeat(10) }).ok === true);
  assert("feedback =1000", validateFeedbackSubmission({ ...validSubmission, feedbackText: "x".repeat(1000) }).ok === true);
  assert("display name >50", validateFeedbackSubmission({ ...validSubmission, displayName: "x".repeat(51) }).ok === false);
  assert(
    "publication permission missing",
    validateFeedbackSubmission({ rating: 5, feedbackText: validSubmission.feedbackText }).ok === false,
  );
  assert(
    "unknown moderation field rejected",
    validateFeedbackSubmission({ ...validSubmission, moderationStatus: "approved" }).ok === false,
  );
  assert("featured rejected", validateFeedbackSubmission({ ...validSubmission, featured: true }).ok === false);
  assert(
    "lastSubmittedAt rejected",
    validateFeedbackSubmission({ ...validSubmission, lastSubmittedAt: now.toISOString() }).ok === false,
  );
  assert("profileId rejected", validateFeedbackSubmission({ ...validSubmission, profileId: "x" }).ok === false);
  assert("clerkUserId rejected", validateFeedbackSubmission({ ...validSubmission, clerkUserId: "x" }).ok === false);
  assert("safe 400 copy", FEEDBACK_VALIDATION_ERROR === "Please check your feedback and try again.");

  const privateOk = validateFeedbackSubmission({
    ...validSubmission,
    publicationPermission: false,
    displayName: "   ",
  });
  assert(
    "private consent + empty name",
    privateOk.ok && privateOk.data.displayName === null && privateOk.data.publicationPermission === false,
  );

  const first = decideFeedbackWrite({
    existing: null,
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: privateOk.data,
    now,
  });
  assert("first submission creates row", first.type === "create");
  assert("first row pending", first.payload.moderation_status === "pending");
  assert("first row not featured", first.payload.featured === false);
  assert("first last_submitted_at set", first.payload.last_submitted_at === now.toISOString());
  assert("private consent timestamp null", first.payload.publication_permission_granted_at === null);
  assert("identity from server context", first.payload.profile_id === "profile-1" && first.payload.clerk_user_id === "user_clerk_1");
  assert("first moderation metadata null", first.payload.moderated_at === null && first.payload.moderated_by_clerk_user_id === null && first.payload.moderation_note === null);

  const publicCreate = decideFeedbackWrite({
    existing: null,
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: { ...validSubmission, displayName: "Samar P.", publicationPermission: true },
    now,
  });
  assert("public consent timestamp set server-side", publicCreate.payload.publication_permission_granted_at === now.toISOString());

  const throttled = decideFeedbackWrite({
    existing: { last_submitted_at: withinThrottle },
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: {
      rating: 4,
      feedbackText: "Updated after thinking more about the product.",
      displayName: "Samar P.",
      publicationPermission: true,
    },
    now,
  });
  assert("second submission within 24h throttled", throttled.type === "throttle");
  assert("throttle copy", FEEDBACK_THROTTLE_ERROR.includes("wait before submitting"));

  const later = decideFeedbackWrite({
    existing: { last_submitted_at: olderThanThrottle },
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: {
      rating: 4,
      feedbackText: "Updated after thinking more about the product.",
      displayName: "Samar P.",
      publicationPermission: false,
    },
    now,
  });
  assert("valid submission after 24h creates new row", later.type === "create");
  assert("later row same profile_id", later.payload.profile_id === first.payload.profile_id);
  assert("later last_submitted_at set", later.payload.last_submitted_at === now.toISOString());
  assert("later row pending", later.payload.moderation_status === "pending");
  assert("later featured false", later.payload.featured === false);
  assert("later moderation metadata null", later.payload.moderated_at === null && later.payload.moderated_by_clerk_user_id === null && later.payload.moderation_note === null);
  assert("later private timestamp null", later.payload.publication_permission_granted_at === null);
  assert("no update decision type", later.type !== "update" && first.type !== "update");

  const adminTouched = decideFeedbackWrite({
    existing: {
      last_submitted_at: olderThanThrottle,
      updated_at: withinThrottle,
    },
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: {
      rating: 4,
      feedbackText: "Updated after thinking more about the product.",
      displayName: "Samar P.",
      publicationPermission: true,
    },
    now,
  });
  assert(
    "admin-like updated_at change does not affect throttle",
    adminTouched.type === "create",
  );

  const recentSubmitStaleUpdate = decideFeedbackWrite({
    existing: {
      last_submitted_at: withinThrottle,
      updated_at: olderThanThrottle,
    },
    profileId: "profile-1",
    clerkUserId: "user_clerk_1",
    submission: {
      rating: 4,
      feedbackText: "Updated after thinking more about the product.",
      displayName: "Samar P.",
      publicationPermission: true,
    },
    now,
  });
  assert(
    "throttle uses last_submitted_at not updated_at",
    recentSubmitStaleUpdate.type === "throttle",
  );

  assert("approved + public visible", isPubliclyVisibleFeedback({ moderation_status: "approved", publication_permission: true }));
  assert("private approved hidden", !isPubliclyVisibleFeedback({ moderation_status: "approved", publication_permission: false }));
  assert("public pending hidden", !isPubliclyVisibleFeedback({ moderation_status: "pending", publication_permission: true }));
  assert("public rejected hidden", !isPubliclyVisibleFeedback({ moderation_status: "rejected", publication_permission: true }));

  const published = toPublishedUserFeedback({
    rating: 5,
    feedback_text: "Great product for planning.",
    display_name: null,
    created_at: "2026-09-01T00:00:00.000Z",
    featured: true,
  });
  assert("display name fallback", published.displayName === "IMMIFIN User" && resolvePublicDisplayName(null) === "IMMIFIN User");
  assert(
    "safe published fields only",
    Object.keys(published).sort().join(",") === "createdAt,displayName,featured,feedbackText,rating",
  );

  const routeSrc = readSource("app/api/feedback/route.ts");
  const serviceSrc = readSource("lib/feedback/feedbackService.ts");
  const rulesSrc = readSource("lib/feedback/feedbackRules.ts");
  const validationSrc = readSource("lib/feedback/feedbackValidation.ts");
  const migration019Src = readSource("supabase/migrations/20260912120000_019_user_feedback.sql");
  const migration020Src = readSource("supabase/migrations/20260913120000_020_user_feedback_history.sql");
  const typesSrc = readSource("lib/supabase/types.ts");

  assert("POST /api/feedback exists", existsSync("app/api/feedback/route.ts") && routeSrc.includes("export async function POST"));
  assert("no public GET JSON endpoint", !routeSrc.includes("export async function GET"));
  assert("auth via requireUser", routeSrc.includes("requireUser()"));
  assert("identity from profile context", routeSrc.includes("profileWithRelations.profile.id") && routeSrc.includes("profileWithRelations.profile.clerk_user_id"));
  assert("accepted submission returns 201", /status:\s*201/.test(routeSrc) && !routeSrc.includes("result.created ? 201 : 200"));
  assert("safe unexpected 500", routeSrc.includes("We couldn't save your feedback right now"));
  assert("middleware JSON 401 pattern", PUBLIC_ROUTE_PATTERNS.some((pattern) => String(pattern).includes("/api/feedback")));
  assert("latest lookup by last_submitted_at desc", serviceSrc.includes('.order("last_submitted_at", { ascending: false })') && serviceSrc.includes(".limit(1)"));
  assert("service inserts new row", serviceSrc.includes(".insert(decision.payload)"));
  assert("upsert/update write path removed", !serviceSrc.includes(".update(") && !serviceSrc.includes(".upsert("));
  assert("rules have no update decision", !rulesSrc.includes('type: "update"') && !rulesSrc.includes('return { type: "update"'));
  assert("public query approved + permission", serviceSrc.includes('.eq("moderation_status", "approved")') && serviceSrc.includes('.eq("publication_permission", true)'));
  assert("public sort featured desc, created_at desc", serviceSrc.includes('.order("featured", { ascending: false })') && serviceSrc.includes('.order("created_at", { ascending: false })'));
  assert("no public API route folder extra", !existsSync("app/api/feedback/public"));
  assert("no what-users-say UI", !existsSync("app/about/what-users-say"));
  assert("throttle is 24h", FEEDBACK_UPDATE_THROTTLE_MS === 24 * 60 * 60 * 1000);
  assert("migration 019 has last_submitted_at", /last_submitted_at timestamptz not null default now\(\)/.test(migration019Src));
  assert("updated_at preserved in 019", /updated_at timestamptz not null default now\(\)/.test(migration019Src));
  assert("set_updated_at trigger preserved", migration019Src.includes("user_feedback_set_updated_at") && migration019Src.includes("public.set_updated_at()"));
  assert("019 unique left in place historically", migration019Src.includes("constraint user_feedback_profile_id_unique unique (profile_id)"));
  assert("020 drops profile unique", migration020Src.includes("drop constraint user_feedback_profile_id_unique"));
  assert("020 adds latest-submission index", /user_feedback_profile_last_submitted_idx[\s\S]*profile_id,\s*last_submitted_at desc/.test(migration020Src));
  assert("020 does not drop required columns", !/drop column/i.test(migration020Src));
  assert("UserFeedback type has last_submitted_at", /last_submitted_at:\s*string/.test(typesSrc));
  assert("throttle evaluates last_submitted_at", rulesSrc.includes("input.existing.last_submitted_at"));
  assert("throttle does not evaluate existing.updated_at", !rulesSrc.includes("input.existing.updated_at"));
  assert("public mapper omits last_submitted_at", !Object.keys(published).includes("lastSubmittedAt"));
  assert("no seeded testimonials in rules", !/Samar|Great product|testimonial/i.test(rulesSrc.split("export")[0] ?? ""));
  assert("validation does not rewrite wording", !/rewrite|openai|summar/i.test(validationSrc));

  const publicSelect = serviceSrc.slice(serviceSrc.indexOf("export async function getPublishedUserFeedback"));
  assert("public reader still filters approved + permission", publicSelect.includes('.eq("moderation_status", "approved")') && publicSelect.includes('.eq("publication_permission", true)'));
  assert("public reader does not select last_submitted_at", !publicSelect.includes("last_submitted_at"));
  assert("public reader has no one-published-per-user rule", !/one.?published|distinct on|profile_id/i.test(publicSelect));

  console.log("\nS7A-DS2-FEEDBACK-HISTORY-006A verification passed.");
}

main();
