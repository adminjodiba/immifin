/**
 * S7-UI-008B — Context-aware Immigration and Calculator menu labels.
 * Run: npx tsx scripts/verify-s7-ui-008b-context-labels.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  calculatorMenuLinks,
  calculatorMenuSections,
} from "../lib/calculator-menu.ts";
import {
  immigrationMenuLinks,
  immigrationMenuSections,
} from "../lib/immigration-menu.ts";
import { navLinks } from "../lib/site.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

const SALARY_HREF = "/immigration/h1b-wage-level-estimator";
const LOTTERY_HREF = "/immigration/h1b-lottery-odds-calculator";
const MOVEMENT_HREF = "/immigration/visa-bulletin-movement";

function main() {
  assert(
    "Top-level Immigration and Calculators present",
    navLinks.some((l) => l.href === "/immigration") &&
      navLinks.some((l) => l.href === "/calculators"),
  );

  const immigrationLabels = immigrationMenuLinks.map((i) => i.label);
  assert(
    "Immigration has exactly six approved entries",
    immigrationLabels.length === 6,
  );
  assert(
    "Immigration labels match approved order and naming",
    immigrationLabels.join("|") ===
      [
        "📊 Current Visa Bulletin",
        "🗂️ Visa Bulletin History",
        "📈 Movement Tracker",
        "💼 H-1B Salary Estimator",
        "🎲 H-1B Lottery Odds",
        "🌍 Global Visa Stamping Map",
      ].join("|"),
  );

  const history = immigrationMenuLinks.find(
    (i) => i.href === "/immigration/visa-bulletin-history",
  );
  assert("Visa Bulletin History restored in Immigration top nav", Boolean(history));
  assert(
    "Visa Bulletin History keeps visaHistory premium preview",
    history?.premiumPreview === "visaHistory",
  );

  assert(
    "Immigration section grouping preserved",
    immigrationMenuSections.map((s) => s.id).join("|") ===
      "visa-bulletin|h1b-tools|visa-services",
  );

  const calculatorLabels = calculatorMenuLinks.map((i) => i.label);
  assert(
    "Calculators has exactly four approved entries",
    calculatorLabels.length === 4,
  );
  assert(
    "Calculators labels match approved order and naming",
    calculatorLabels.join("|") ===
      [
        "🧮 Green Card Wait Calculator",
        "🧮 Citizenship Calculator",
        "🧮 H-1B Salary Calculator",
        "🧮 H-1B Lottery Calculator",
      ].join("|"),
  );

  assert("Calculators keeps Immigration section", calculatorMenuSections[0]?.id === "immigration");

  const immigrationSalary = immigrationMenuLinks.find((i) => i.href === SALARY_HREF);
  const calculatorSalary = calculatorMenuLinks.find((i) => i.href === SALARY_HREF);
  const immigrationLottery = immigrationMenuLinks.find((i) => i.href === LOTTERY_HREF);
  const calculatorLottery = calculatorMenuLinks.find((i) => i.href === LOTTERY_HREF);

  assert("Immigration Salary label is Estimator", immigrationSalary?.label === "💼 H-1B Salary Estimator");
  assert("Calculators Salary label is Calculator", calculatorSalary?.label === "🧮 H-1B Salary Calculator");
  assert("Immigration Lottery label is Odds", immigrationLottery?.label === "🎲 H-1B Lottery Odds");
  assert("Calculators Lottery label is Calculator", calculatorLottery?.label === "🧮 H-1B Lottery Calculator");

  assert("Salary href shared", immigrationSalary?.href === calculatorSalary?.href && immigrationSalary?.href === SALARY_HREF);
  assert(
    "Lottery href shared",
    immigrationLottery?.href === calculatorLottery?.href && immigrationLottery?.href === LOTTERY_HREF,
  );

  const movement = immigrationMenuLinks.find((i) => i.href === MOVEMENT_HREF);
  assert("Movement Tracker premium preview preserved", movement?.premiumPreview === "movementTracker");
  assert("Movement Tracker not greyscale / still labeled Movement Tracker", movement?.label.includes("Movement Tracker"));

  assert(
    "Green Card uses calculator route",
    calculatorMenuLinks.some(
      (i) => i.href === "/calculators/green-card-wait-time" && i.label.includes("Green Card Wait Calculator"),
    ),
  );
  assert(
    "Citizenship uses calculator route",
    calculatorMenuLinks.some(
      (i) => i.href === "/calculators/citizenship-eligibility" && i.label.includes("Citizenship Calculator"),
    ),
  );

  const headerSource = readFileSync(resolve("components/Header.tsx"), "utf8");
  assert("Header still builds Immigration sections", headerSource.includes("buildImmigrationSections"));
  assert("Header still builds Calculator sections", headerSource.includes("buildCalculatorSections"));
  assert("Header preserves Movement preview interception", headerSource.includes("resolvePremiumPreview"));

  console.log("\nAll S7-UI-008B context-aware menu label checks passed.");
}

main();
