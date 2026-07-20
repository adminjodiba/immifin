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
const tailwind = readFileSync(resolve("tailwind.config.ts"), "utf8");
const billing = readFileSync(resolve("components/billing/BillingCenter.tsx"), "utf8");
const calculators = [
  "components/CitizenshipEligibilityCalculator.tsx",
  "components/GreenCardWaitTimeCalculator.tsx",
  "components/H1bWageLevelEstimator.tsx",
  "components/H1bLotteryOddsCalculator.tsx",
].map((path) => ({ path, source: readFileSync(resolve(path), "utf8") }));

assert(
  "Gold token --immifin-button-hover-gold is defined",
  css.includes("--immifin-button-hover-gold:"),
);
assert(
  "Electric Cyan default token is defined",
  css.includes("--immifin-button-default-cyan:"),
);
assert(
  "Gold text contrast token is defined",
  css.includes("--immifin-button-hover-gold-text:"),
);
assert("Sweep duration is ~320ms", css.includes("--immifin-button-sweep-duration: 320ms"));
assert(
  "Tailwind exposes button-hover-gold token",
  tailwind.includes('"button-hover-gold"') || tailwind.includes("button-hover-gold"),
);

assert("Primary uses ::before sweep layer", /\.btn-primary::before/.test(css));
assert("Secondary uses ::before sweep layer", /\.btn-secondary::before/.test(css));
assert("Ghost-light uses ::before sweep layer", /\.btn-ghost-light::before/.test(css));
assert("White uses ::before sweep layer", /\.btn-white::before/.test(css));
assert("Sweep starts off-canvas left", css.includes("translateX(-101%)"));
assert("Hover/focus sweeps to 0", css.includes("transform: translateX(0)"));
assert("Sweep layer is pointer-events none", css.includes("pointer-events: none"));
assert("Buttons isolate stacking", css.includes("isolation: isolate"));
assert("Buttons clip to radius via overflow hidden", /overflow:\s*hidden/.test(css));

assert("Disabled buttons keep sweep off", css.includes(":disabled::before"));
assert("Reduced motion disables sliding transition", css.includes("prefers-reduced-motion: reduce"));
assert("Danger outline variant has no gold ::before", !/\.btn-danger::before/.test(css));
assert("Danger solid variant exists", css.includes(".btn-danger-solid"));
assert("btn-no-sweep opt-out exists", css.includes(".btn-no-sweep::before"));

assert(
  "Instant primary hover:bg-brand-800 removed from shared class",
  !/\.btn-primary\s*\{[^}]*hover:bg-brand-800/s.test(css),
);
assert(
  "Instant secondary hover:bg-brand-50 removed from shared class",
  !/\.btn-secondary\s*\{[^}]*hover:bg-brand-50/s.test(css),
);

assert("Billing danger actions use btn-danger", billing.includes('"btn-danger"'));
assert(
  "Billing no longer gold-sweeps danger via btn-secondary overrides",
  !billing.includes("btn-secondary border-red-200"),
);

for (const { path, source } of calculators) {
  assert(`${path} uses btn-primary CTA`, source.includes("btn-primary"));
  assert(
    `${path} no longer uses ad-hoc brand-700 CTA hover fill`,
    !source.includes("hover:bg-brand-800 disabled:cursor-not-allowed"),
  );
}

const adminRefresh = readFileSync(
  resolve("components/admin/AdminDatasetRefreshButton.tsx"),
  "utf8",
);
assert("Admin dataset refresh uses btn-primary", adminRefresh.includes("btn-primary"));

const currentPlanLib = readFileSync(resolve("lib/pricing/checkout-plan-actions.ts"), "utf8");
assert(
  "Current Plan checkout buttons opt out with btn-no-sweep",
  currentPlanLib.includes("btn-no-sweep"),
);

if (process.exitCode) {
  console.error("\nS7-DS-001 button sweep verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-DS-001 button sweep checks passed.");
