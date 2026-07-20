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
const header = readFileSync(resolve("components/Header.tsx"), "utf8");

assert("Trigger base background forced transparent", /\.nav-menu-trigger\s*\{[^}]*background-color:\s*transparent/s.test(css));
assert("Item base background forced transparent", /\.nav-menu-item\s*\{[^}]*background-color:\s*transparent/s.test(css));
assert("Trigger hover keeps transparent background", /\.nav-menu-trigger:hover[\s\S]*?background-color:\s*transparent/.test(css));
assert("Item hover keeps transparent background", /\.nav-menu-item:hover[\s\S]*?background-color:\s*transparent/.test(css));
assert("::before uses z-index 0 (not -1)", /\.nav-menu-item::before\s*\{[^}]*z-index:\s*0/s.test(css) && /\.nav-menu-trigger::before\s*\{[^}]*z-index:\s*0/s.test(css));
assert("No z-index -1 on menu ::before", !/\.nav-menu-(?:trigger|item)::before\s*\{[^}]*z-index:\s*-1/s.test(css));
assert("Sweep transform uses linear timing", /nav-menu-item::before[\s\S]*?transition:\s*transform var\(--immifin-menu-sweep-duration\) linear/.test(css));
assert("Sweep duration remains ~300ms", css.includes("--immifin-menu-sweep-duration: 300ms"));
assert("No will-change on menu ::before", !/\.nav-menu-(?:trigger|item)::before\s*\{[^}]*will-change/s.test(css));
assert("Dropdown panel avoids transition-all", header.includes("transition-[opacity,visibility]") && !header.includes("transition-all duration-200 group-hover:visible"));
assert("Header still has no hover:bg-brand-50", !header.includes("hover:bg-brand-50"));
assert("Content layer still z-[1]", header.includes('relative z-[1]'));

if (process.exitCode) {
  console.error("\nS7-UI-014 nav sweep fill fix verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-UI-014 nav sweep fill fix checks passed.");
