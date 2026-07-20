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
const hero = readFileSync(resolve("components/Hero.tsx"), "utf8");
const home = readFileSync(resolve("app/page.tsx"), "utf8");

const compactStart = hero.indexOf("if (compact)");
const fullHeroStart = hero.indexOf("\n  return (", compactStart + 1);
const compactBlock = hero.slice(compactStart, fullHeroStart);

assert("Ribbon duration token present", css.includes("--immifin-hero-ribbon-duration: 12s"));
assert("Travel uses container query units", css.includes("100cqi"));
assert("Round-trip shore loop uses linear cruise", /animation:\s*hero-ribbon-shore var\(--immifin-hero-ribbon-duration\) linear infinite/.test(css));
assert("Bounce token defined", css.includes("--immifin-hero-ribbon-bounce:"));
assert("Right bounce is turnaround apex only", css.includes("calc(var(--hero-ribbon-travel) - var(--hero-ribbon-bounce))"));
assert("No settle-back-to-edge after right bounce", !/50%\s*\{[^}]*translateX\(var\(--hero-ribbon-travel\)\)/.test(css));
assert("Left bounce turnaround feeds next loop", /100%\s*\{[^}]*translateX\(var\(--hero-ribbon-bounce\)\)/.test(css));
assert("Reduced motion disables ribbon travel", /prefers-reduced-motion[\s\S]*hero-ribbon-title-shuttle/.test(css));
assert("Compact hero uses title rail", hero.includes("hero-ribbon-title-rail"));
assert("Compact hero uses title shuttle", hero.includes("hero-ribbon-title-shuttle"));
assert("Title shuttle wraps heading for float", compactBlock.includes("hero-ribbon-title-float"));
assert("Landing still passes approved phrase", home.includes('"Immigration, Finance & Life in America"'));
assert("Compact ribbon removes FavoriteStar", !compactBlock.includes("FavoriteStar"));
assert("Title rail spans blue section width", compactBlock.includes("hero-ribbon-title-rail mt-3"));

if (process.exitCode) {
  console.error("\nS7-UI-013 ribbon animation verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-UI-013 ribbon animation checks passed.");
