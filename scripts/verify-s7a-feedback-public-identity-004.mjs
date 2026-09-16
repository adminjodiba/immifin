/**
 * S7A-FEEDBACK-PUBLIC-IDENTITY-004 — public testimonial identity masking.
 * Run: npx tsx scripts/verify-s7a-feedback-public-identity-004.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FEEDBACK_PUBLIC_DISPLAY_NAME_FALLBACK,
  resolvePublicTestimonialIdentity,
} from "../lib/feedback/feedbackValidation.ts";
import { maskEmailForPublicDisplay } from "../lib/feedback/maskEmailForPublicDisplay.ts";
import {
  WHAT_USERS_SAY_PUBLIC_COLUMNS,
  buildWhatUsersSaySnapshot,
} from "../lib/feedback/whatUsersSay.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  assert("samar@gmail.com", maskEmailForPublicDisplay("samar@gmail.com") === "sa***@gm***.com");
  assert(
    "samar.acharya@gmail.com",
    maskEmailForPublicDisplay("samar.acharya@gmail.com") === "sa***.ac*****@gm***.com",
  );
  assert("john.doe@yahoo.com", maskEmailForPublicDisplay("john.doe@yahoo.com") === "jo**.do*@ya***.com");
  assert("abcdef@outlook.com", maskEmailForPublicDisplay("abcdef@outlook.com") === "ab****@ou*****.com");
  assert("person@example.org", maskEmailForPublicDisplay("person@example.org") === "pe****@ex*****.org");
  assert("person@example.net", maskEmailForPublicDisplay("person@example.net") === "pe****@ex*****.net");
  assert("1-character local", maskEmailForPublicDisplay("a@gmail.com") === "a@gm***.com");
  assert("2-character local", maskEmailForPublicDisplay("ab@gmail.com") === "ab@gm***.com");
  assert("3-character local", maskEmailForPublicDisplay("abc@gmail.com") === "ab*@gm***.com");
  assert(
    "multi-dot local",
    maskEmailForPublicDisplay("ann.marie.lee@gmail.com") === "an*.ma***.le*@gm***.com",
  );
  assert("non-.com domain .io", maskEmailForPublicDisplay("person@example.io") === "pe****@ex*****.io");
  assert(
    "multi-part domain suffix .co.uk",
    maskEmailForPublicDisplay("person@example.co.uk") === "pe****@ex*****.co.uk",
  );
  assert(
    "multi-part domain suffix .co.in",
    maskEmailForPublicDisplay("person@example.co.in") === "pe****@ex*****.co.in",
  );

  const malformed = [null, undefined, "", "   ", "not-an-email", "@@@", "user@", "@gmail.com", 42, {}, "samar@@gmail.com"];
  for (const value of malformed) {
    const masked = maskEmailForPublicDisplay(value);
    assert(`malformed/missing returns null (${String(value)})`, masked === null);
    if (typeof value === "string" && value.length > 0) {
      assert(`malformed string is not echoed (${value})`, masked !== value);
    }
  }

  assert(
    "display name wins over email",
    resolvePublicTestimonialIdentity("Jay Acharya", "samar@gmail.com") === "Jay Acharya",
  );
  assert(
    "blank display name uses masked email",
    resolvePublicTestimonialIdentity("   ", "samar@gmail.com") === "sa***@gm***.com",
  );
  assert(
    "missing email uses generic fallback",
    resolvePublicTestimonialIdentity(null, null) === FEEDBACK_PUBLIC_DISPLAY_NAME_FALLBACK,
  );
  assert(
    "malformed email uses generic fallback, not raw",
    resolvePublicTestimonialIdentity("", "not-an-email") === FEEDBACK_PUBLIC_DISPLAY_NAME_FALLBACK,
  );

  const snapshot = buildWhatUsersSaySnapshot([
    {
      id: "named",
      profileId: "p1",
      rating: 5,
      feedbackText: "Named review text.",
      displayName: "Priya Sharma",
      createdAt: "2026-09-02T00:00:00.000Z",
    },
    {
      id: "masked",
      profileId: "p2",
      rating: 5,
      feedbackText: "Masked review text.",
      displayName: resolvePublicTestimonialIdentity(null, "samar.acharya@gmail.com"),
      createdAt: "2026-09-01T00:00:00.000Z",
    },
  ]);
  const payload = JSON.stringify(snapshot);
  assert("snapshot keeps supplied display name", payload.includes("Priya Sharma"));
  assert("snapshot keeps server-masked email", payload.includes("sa***.ac*****@gm***.com"));
  assert("snapshot omits raw login email", !payload.includes("samar.acharya@gmail.com"));
  assert("snapshot omits profile id", !payload.includes("profileId") && !payload.includes("p1"));
  assert("pool columns omit email", !WHAT_USERS_SAY_PUBLIC_COLUMNS.includes("email"));

  const serviceSource = readFileSync(resolve("lib/feedback/whatUsersSayService.ts"), "utf8");
  const publicTypeSource = readFileSync(resolve("lib/feedback/whatUsersSay.ts"), "utf8");
  const adminSource = readFileSync(resolve("lib/feedback/adminFeedbackReview.ts"), "utf8");
  assert("service resolves identity before snapshot", serviceSource.includes("resolvePublicTestimonialIdentity"));
  assert("service never selects email on user_feedback", !WHAT_USERS_SAY_PUBLIC_COLUMNS.includes("email"));
  assert(
    "public DTO has no email field",
    !/export type PublicWhatUsersSayTestimonial = \{[\s\S]*?email[\s\S]*?\}/.test(publicTypeSource),
  );
  assert("admin review still has its own mask", adminSource.includes("function maskEmail"));
  assert("admin review still loads profile email", adminSource.includes("profile?.email"));

  console.log("\nAll public identity masking checks passed.");
}

main();
