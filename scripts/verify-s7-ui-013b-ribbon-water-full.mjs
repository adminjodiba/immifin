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

assert("Wave layers span full ribbon height", /\.hero-ribbon-wave\s*\{[^}]*height:\s*100%/s.test(css) && /\.hero-ribbon-wave\s*\{[^}]*inset:\s*0/s.test(css));
assert("No bottom-only wave anchoring", !/hero-ribbon-wave--1\s*\{[^}]*bottom:/s.test(css));
assert("Full-height SVG viewBox (300)", css.includes("viewBox='0 0 1200 300'") || css.includes('viewBox="0 0 1200 300"') || css.includes("viewBox%3D%270%200%201200%20300%27"));
assert("Multi-band paths in wave SVGs", (css.match(/fill-opacity/g) || []).length >= 6);
assert("Three full-ribbon layers retained", css.includes("hero-ribbon-wave--1") && css.includes("hero-ribbon-wave--2") && css.includes("hero-ribbon-wave--3"));
assert("Opposite-direction motion retained", css.includes("hero-ribbon-wave-ltr") && css.includes("hero-ribbon-wave-rtl"));
assert("Compact hero still mounts wave stack", hero.includes("hero-ribbon-waves") && hero.includes('aria-hidden="true"'));
assert("Text layer still above waves", hero.includes("relative z-10"));

if (process.exitCode) {
  console.error("\nS7-UI-013B full-ribbon water verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-UI-013B full-ribbon water checks passed.");
