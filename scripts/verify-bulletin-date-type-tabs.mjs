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
const helper = readFileSync(resolve("lib/visa/bulletinDateTypeTabs.ts"), "utf8");
const tailwind = readFileSync(resolve("tailwind.config.ts"), "utf8");
const movement = readFileSync(resolve("components/VisaBulletinMovementTracker2.tsx"), "utf8");

assert("Final Action token defined", css.includes("--immifin-bulletin-final-action:"));
assert("Filing token defined", css.includes("--immifin-bulletin-filing:"));
assert("Final Action CSS class sets solid background", /\.btn-bulletin-final-action\s*\{[^}]*background-color:\s*#4f46e5/s.test(css));
assert("Filing CSS class sets solid background", /\.btn-bulletin-filing\s*\{[^}]*background-color:\s*#0f766e/s.test(css));
assert("Bulletin tabs force white text", /\.btn-bulletin-tab\s*\{[^}]*color:\s*#ffffff/s.test(css));
assert("Tab styles live outside @layer (not tree-shaken)", /flex-shrink:\s*0;\s*\}\s*\/\*\*[\s\S]*Visa Bulletin Final Action[\s\S]*\.btn-bulletin-final-action/.test(css));
assert("Compact size padding defined in CSS", css.includes(".btn-bulletin-tab--compact"));
assert("Gold sweep ::before retained", css.includes(".btn-bulletin-tab::before"));
assert("Helper uses CSS classes only", helper.includes("btn-bulletin-final-action") && helper.includes("btn-bulletin-filing"));
assert("Helper does not rely on Tailwind utility bg-", !helper.includes("bg-indigo-600"));
assert("Tailwind content includes lib/", tailwind.includes('"./lib/**/*.{js,ts,jsx,tsx,mdx}"'));
assert("Movement tracker uses gap-3 tablist", movement.includes('className="mb-3 flex flex-wrap items-center gap-3"'));

if (process.exitCode) {
  console.error("\nBulletin date-type tab styling verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll bulletin date-type tab styling checks passed.");
