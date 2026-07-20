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

assert("Wave duration tokens in recommended ranges", css.includes("--immifin-ribbon-wave-duration-1: 14s") && css.includes("--immifin-ribbon-wave-duration-2: 22s") && css.includes("--immifin-ribbon-wave-duration-3: 30s"));
assert("Cyan / blue / soft highlight wave tokens", css.includes("--immifin-ribbon-wave-cyan") && css.includes("--immifin-ribbon-wave-blue") && css.includes("--immifin-ribbon-wave-highlight"));
assert("Three wave layer classes", css.includes("hero-ribbon-wave--1") && css.includes("hero-ribbon-wave--2") && css.includes("hero-ribbon-wave--3"));
assert("Opposite-direction wave keyframes", css.includes("hero-ribbon-wave-ltr") && css.includes("hero-ribbon-wave-rtl"));
assert("Linear continuous wave motion", css.includes("linear infinite"));
assert("Shore-to-shore travel preserved", css.includes("hero-ribbon-shore") && css.includes("--hero-ribbon-travel"));
assert("Subtle vertical float ~2–4px", css.includes("--immifin-ribbon-float-distance: 3px") && css.includes("hero-ribbon-float"));
assert("Text stacking above waves (z-index)", compactBlock.includes('z-10') && css.includes("hero-ribbon-waves") && /hero-ribbon-waves\s*\{[^}]*z-index:\s*1/s.test(css));
assert("Waves aria-hidden", compactBlock.includes('aria-hidden="true"'));
assert("Reduced motion stops waves and float", /prefers-reduced-motion[\s\S]*hero-ribbon-wave--1[\s\S]*animation:\s*none/.test(css) && /prefers-reduced-motion[\s\S]*hero-ribbon-title-float/.test(css));
assert("Mobile reduces amplitude", /max-width:\s*640px[\s\S]*--immifin-ribbon-wave-amplitude:\s*0\.65/.test(css));
assert("No JS animation loop in Hero", !/requestAnimationFrame|setInterval|gsap|framer-motion/i.test(hero));
assert("Slogan unchanged", home.includes('"Immigration, Finance & Life in America"'));
assert("FavoriteStar still removed from compact ribbon", !compactBlock.includes("FavoriteStar"));
assert("Title shuttle wraps float child", compactBlock.includes("hero-ribbon-title-shuttle") && compactBlock.includes("hero-ribbon-title-float"));

if (process.exitCode) {
  console.error("\nS7-UI-013A ribbon water surface verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-UI-013A ribbon water surface checks passed.");
