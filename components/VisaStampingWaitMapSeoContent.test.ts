import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { PETITION_BASED_WAIT_ESTIMATE_NOTE } from "../lib/visa/visaStampingWaitTimes";

const page = readFileSync(
  join(process.cwd(), "app/immigration/visa-stamping-wait-map/page.tsx"),
  "utf8",
);
const seo = readFileSync(join(process.cwd(), "components/VisaStampingWaitMapSeoContent.tsx"), "utf8");
const waitMap = readFileSync(join(process.cwd(), "components/VisaStampingWaitMap.tsx"), "utf8");

describe("Visa Stamping search experience (S7A-SEO-VISA-STAMP-007)", () => {
  it("uses a stronger search title, description, canonical, and index/follow metadata", () => {
    assert.equal(page.includes('title: "H-1B & U.S. Visa Appointment Wait Times"'), true);
    assert.equal(
      page.includes(
        "Compare U.S. visa appointment wait-time estimates by consulate, including H-1B petition-based estimates, India locations, and historical trends using Department of State data.",
      ),
      true,
    );
    assert.equal(page.includes('path: "/immigration/visa-stamping-wait-map"'), true);
    assert.equal(page.includes("VisaStampingWaitMapSeoContent"), true);
    assert.equal(page.includes("FAQPage"), false);
    assert.equal(page.includes("noindex"), false);
    assert.equal(seo.includes("FAQPage"), false);
    assert.equal(seo.includes("application/ld+json"), false);
  });

  it("keeps one search-oriented H1 on the interactive product", () => {
    const h1Matches = waitMap.match(/<h1\b/g) ?? [];
    assert.equal(h1Matches.length, 1);
    assert.equal(waitMap.includes('const PAGE_TITLE = "U.S. Visa Appointment Wait Times"'), true);
    assert.equal(seo.includes("<h1"), false);
  });

  it("server-renders the approved headings, H-1B semantics, India posts, and FAQ", () => {
    assert.equal(seo.includes("U.S. Visa Appointment Wait Times"), true);
    assert.equal(seo.includes("H-1B Visa Appointment Wait Times"), true);
    assert.equal(seo.includes("H-1B Visa Appointment Wait Times in India"), true);
    assert.equal(seo.includes("Compare U.S. Consulate Wait Times"), true);
    assert.equal(seo.includes("How to Use the Visa Stamping Wait Map"), true);
    assert.equal(seo.includes("Visa Appointment Wait Times FAQ"), true);
    assert.equal(seo.includes("What is a U.S. visa appointment wait time?"), true);
    assert.equal(seo.includes("Are IMMIFIN visa wait times real-time appointment availability?"), true);
    assert.equal(
      seo.includes("Does the Department of State publish a separate H-1B appointment wait time?"),
      true,
    );
    assert.equal(
      seo.includes("Which U.S. consulates in India can I compare for H-1B wait times?"),
      true,
    );
    assert.equal(seo.includes("Can visa appointment wait times change?"), true);
    assert.equal(seo.includes("PETITION_BASED_WAIT_ESTIMATE_NOTE"), true);
    assert.equal(
      PETITION_BASED_WAIT_ESTIMATE_NOTE,
      "For H-1B, IMMIFIN displays the Department of State's published petition-based (H, L, O, P, Q) appointment wait estimate.",
    );
    assert.equal(seo.includes("Chennai"), true);
    assert.equal(seo.includes("Hyderabad"), true);
    assert.equal(seo.includes("Kolkata"), true);
    assert.equal(seo.includes("Mumbai"), true);
    assert.equal(seo.includes("New Delhi"), true);
  });

  it("does not claim live slots, expose the recipe, or hardcode current India wait days", () => {
    assert.equal(/Real-time U\.S\. visa/i.test(seo), false);
    assert.equal(seo.includes("live appointment inventory"), true);
    assert.equal(seo.includes("do not guarantee"), true);
    assert.equal(seo.includes("±15"), false);
    assert.equal(seo.includes("15-day"), false);
    assert.equal(seo.includes("Wait Time H,L,O,P,Q"), false);
    assert.equal(seo.includes("stamping_wait_time_current"), false);
    assert.equal(seo.includes("30 days"), false);
    assert.equal(seo.includes("45 days"), false);
    assert.equal(seo.includes("90 days"), false);
    assert.equal(seo.includes("165 days"), false);
    assert.match(seo, /No\./);
  });
});
