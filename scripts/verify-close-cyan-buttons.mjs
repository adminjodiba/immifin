import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function assert(label, condition) {
  if (!condition) {
    console.error(`✗ ${label}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${label}`);
}

const css = readFileSync(resolve("app/globals.css"), "utf8");
const pageHeader = readFileSync(resolve("components/PageHeader.tsx"), "utf8");
const visaDash = readFileSync(resolve("components/VisaBulletinDashboard2.tsx"), "utf8");
const visaHistory = readFileSync(resolve("components/VisaBulletinHistoricalTrends.tsx"), "utf8");
const visaMove = readFileSync(resolve("components/VisaBulletinMovementTracker2.tsx"), "utf8");
const about = readFileSync(resolve("app/about/page.tsx"), "utf8");
const privacy = readFileSync(resolve("app/privacy/page.tsx"), "utf8");
const home = readFileSync(resolve("app/page.tsx"), "utf8");

assert(
  "Electric Cyan token defined",
  css.includes("--immifin-button-default-cyan: #00c2d7"),
);
assert("Gold hover token preserved", css.includes("--immifin-button-hover-gold:"));
assert(
  "Shared CTAs use cyan background token",
  css.includes("background-color: var(--immifin-button-default-cyan)"),
);
assert("Shared CTAs use white text at rest", /text-white/.test(css));
assert("Gold sweep ::before retained", css.includes("translateX(-101%)"));
assert("Danger buttons remain separate", css.includes(".btn-danger"));
assert("PageHeader defaults showClose true", pageHeader.includes("showClose = true"));
assert("PageHeader injects DashboardCloseAction", pageHeader.includes("<DashboardCloseAction />"));
assert("Visa Bulletin Dashboard has Close", visaDash.includes("DashboardCloseAction"));
assert("Visa Bulletin History has Close", visaHistory.includes("DashboardCloseAction"));
assert("Movement Tracker has Close", visaMove.includes("DashboardCloseAction"));
assert(
  "About does not duplicate Close in actions",
  !about.includes("actions={<DashboardCloseAction"),
);
assert("Privacy uses PageHeader (inherits Close)", privacy.includes("PageHeader"));
assert("Home page does not use PageHeader Close", !home.includes("DashboardCloseAction"));

if (process.exitCode) {
  console.error("\nClose + Electric Cyan verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll Close + Electric Cyan checks passed.");
