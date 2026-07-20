/**
 * S7-UI-008C — Restore Visa Bulletin History in Immigration menu.
 * Run: npx tsx scripts/verify-s7-ui-008c-visa-history-menu.mjs
 */

import {
  calculatorMenuLinks,
} from "../lib/calculator-menu.ts";
import {
  immigrationMenuLinks,
  immigrationMenuSections,
} from "../lib/immigration-menu.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  const labels = immigrationMenuLinks.map((i) => i.label);
  assert(
    "Immigration final ordered labels",
    labels.join("|") ===
      [
        "📊 Current Visa Bulletin",
        "🗂️ Visa Bulletin History",
        "📈 Movement Tracker",
        "💼 H-1B Salary Estimator",
        "🎲 H-1B Lottery Odds",
        "🌍 Global Visa Stamping Map",
      ].join("|"),
  );

  const visaBulletin = immigrationMenuSections.find((s) => s.id === "visa-bulletin");
  assert("History sits in Visa Bulletin section", Boolean(visaBulletin));
  assert(
    "History is directly after Current Visa Bulletin",
    visaBulletin?.items[0]?.href === "/immigration/visa-bulletin" &&
      visaBulletin?.items[1]?.href === "/immigration/visa-bulletin-history" &&
      visaBulletin?.items[2]?.href === "/immigration/visa-bulletin-movement",
  );

  const history = immigrationMenuLinks.find(
    (i) => i.href === "/immigration/visa-bulletin-history",
  );
  assert("History uses existing route", history?.href === "/immigration/visa-bulletin-history");
  assert("History premium preview is visaHistory", history?.premiumPreview === "visaHistory");

  const movement = immigrationMenuLinks.find(
    (i) => i.href === "/immigration/visa-bulletin-movement",
  );
  assert(
    "Movement Tracker premium preview unchanged",
    movement?.premiumPreview === "movementTracker",
  );

  assert(
    "Calculators menu unchanged by History restore",
    calculatorMenuLinks.map((i) => i.label).join("|") ===
      [
        "🧮 Green Card Wait Calculator",
        "🧮 Citizenship Calculator",
        "🧮 H-1B Salary Calculator",
        "🧮 H-1B Lottery Calculator",
      ].join("|"),
  );

  console.log("\nAll S7-UI-008C Visa Bulletin History menu checks passed.");
}

main();
