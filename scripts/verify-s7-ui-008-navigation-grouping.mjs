/**
 * S7-UI-008 — Immigration navigation grouping and Calculators discovery.
 * Updated for S7-UI-008B contextual H-1B labels.
 * Run: npx tsx scripts/verify-s7-ui-008-navigation-grouping.mjs
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

function labelsInSection(sections, sectionId) {
  const section = sections.find((s) => s.id === sectionId);
  return section ? section.items.map((i) => i.label) : [];
}

function hrefsInSection(sections, sectionId) {
  const section = sections.find((s) => s.id === sectionId);
  return section ? section.items.map((i) => i.href) : [];
}

function main() {
  const navHrefOrder = navLinks.map((l) => l.href);
  const immigrationIndex = navHrefOrder.indexOf("/immigration");
  const calculatorsIndex = navHrefOrder.indexOf("/calculators");

  assert("Top-level Immigration present", immigrationIndex >= 0);
  assert("Top-level Calculators present", calculatorsIndex >= 0);
  assert(
    "Calculators is adjacent/near Immigration",
    Math.abs(calculatorsIndex - immigrationIndex) === 1,
  );
  assert(
    'Calculators label is "Calculators"',
    navLinks.find((l) => l.href === "/calculators")?.label === "Calculators",
  );

  assert("Immigration has Visa Bulletin section", Boolean(immigrationMenuSections.find((s) => s.id === "visa-bulletin")));
  assert("Immigration has H-1B Tools section", Boolean(immigrationMenuSections.find((s) => s.id === "h1b-tools")));
  assert("Immigration has Visa Services section", Boolean(immigrationMenuSections.find((s) => s.id === "visa-services")));

  const visaBulletin = labelsInSection(immigrationMenuSections, "visa-bulletin");
  assert(
    "Visa Bulletin includes Current, History, Movement Tracker",
    visaBulletin.join("|") ===
      "📊 Current Visa Bulletin|🗂️ Visa Bulletin History|📈 Movement Tracker",
  );

  const h1bTools = labelsInSection(immigrationMenuSections, "h1b-tools");
  assert(
    "H-1B Tools includes Salary Estimator and Lottery Odds",
    h1bTools.join("|") === "💼 H-1B Salary Estimator|🎲 H-1B Lottery Odds",
  );

  const visaServices = labelsInSection(immigrationMenuSections, "visa-services");
  assert(
    "Visa Services includes Global Visa Stamping Map",
    visaServices.join("|") === "🌍 Global Visa Stamping Map",
  );

  const movement = immigrationMenuLinks.find(
    (item) => item.href === "/immigration/visa-bulletin-movement",
  );
  assert("Movement Tracker label approved", movement?.label.includes("Movement Tracker"));
  assert(
    "Movement Tracker keeps premium preview metadata",
    movement?.premiumPreview === "movementTracker",
  );

  const history = immigrationMenuLinks.find(
    (item) => item.href === "/immigration/visa-bulletin-history",
  );
  assert("Visa Bulletin History restored after Current Visa Bulletin (S7-UI-008C)", Boolean(history));
  assert(
    "Visa Bulletin History label approved",
    history?.label === "🗂️ Visa Bulletin History",
  );
  assert(
    "Visa Bulletin History keeps premium preview metadata",
    history?.premiumPreview === "visaHistory",
  );

  assert("Calculators has Immigration section", calculatorMenuSections.length === 1);
  assert(
    "Calculators Immigration section id",
    calculatorMenuSections[0]?.id === "immigration",
  );

  const calcLabels = calculatorMenuLinks.map((i) => i.label);
  assert(
    "Calculators menu labels in approved order",
    calcLabels.join("|") ===
      "🧮 Green Card Wait Calculator|🧮 Citizenship Calculator|🧮 H-1B Salary Calculator|🧮 H-1B Lottery Calculator",
  );

  const salaryHref = "/immigration/h1b-wage-level-estimator";
  const lotteryHref = "/immigration/h1b-lottery-odds-calculator";
  assert(
    "H-1B Salary Estimator in Immigration",
    hrefsInSection(immigrationMenuSections, "h1b-tools").includes(salaryHref),
  );
  assert(
    "H-1B Lottery Odds in Immigration",
    hrefsInSection(immigrationMenuSections, "h1b-tools").includes(lotteryHref),
  );
  assert(
    "H-1B Salary Calculator cross-linked in Calculators",
    calculatorMenuLinks.some((i) => i.href === salaryHref && i.label === "🧮 H-1B Salary Calculator"),
  );
  assert(
    "H-1B Lottery Calculator cross-linked in Calculators",
    calculatorMenuLinks.some((i) => i.href === lotteryHref && i.label === "🧮 H-1B Lottery Calculator"),
  );

  assert(
    "Green Card Wait uses calculator route",
    calculatorMenuLinks.some(
      (i) =>
        i.label.includes("Green Card Wait Calculator") &&
        i.href === "/calculators/green-card-wait-time",
    ),
  );
  assert(
    "Citizenship uses calculator route",
    calculatorMenuLinks.some(
      (i) =>
        i.label.includes("Citizenship Calculator") &&
        i.href === "/calculators/citizenship-eligibility",
    ),
  );

  const headerSource = readFileSync(resolve("components/Header.tsx"), "utf8");
  assert("Header builds Immigration sections", headerSource.includes("buildImmigrationSections"));
  assert("Header builds Calculator sections", headerSource.includes("buildCalculatorSections"));
  assert("Header uses sectioned NavDropdown", headerSource.includes("sections={immigrationSections}"));
  assert(
    "Header Calculators dropdown uses Calculators label",
    headerSource.includes('label="Calculators"'),
  );
  assert("Header mobile renders section labels", headerSource.includes("submenuSections"));
  assert(
    "Header preserves Movement preview interception",
    headerSource.includes("resolvePremiumPreview"),
  );

  const siteSource = readFileSync(resolve("lib/site.ts"), "utf8");
  assert(
    "site.ts Calculators label",
    /label:\s*"Calculators"/.test(siteSource),
  );

  console.log("\nAll S7-UI-008 navigation grouping checks passed.");
}

main();
