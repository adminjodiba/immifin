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
const favorites = readFileSync(resolve("components/favorites/FavoritesNavDropdown.tsx"), "utf8");

assert("Menu cyan token derives from Electric Cyan", css.includes("--immifin-menu-hover-cyan:"));
assert("Soft menu cyan wash token defined", css.includes("--immifin-menu-hover-cyan-soft:"));
assert("Menu accent cyan defined", css.includes("--immifin-menu-accent-cyan:"));
assert("Menu sweep duration ~300ms", css.includes("--immifin-menu-sweep-duration: 300ms"));
assert("Menu color transition uses ease-in-out", /nav-menu-trigger\s*\{[^}]*transition:\s*color var\(--immifin-menu-sweep-duration\) ease-in-out/s.test(css));
assert("Menu sweep transform uses linear (S7-UI-014)", /nav-menu-item::before[\s\S]*?transition:\s*transform var\(--immifin-menu-sweep-duration\) linear/.test(css));
assert("Reuses button cyan token", css.includes("var(--immifin-button-default-cyan)"));
assert("nav-menu-item sweep class exists", css.includes(".nav-menu-item::before"));
assert("nav-menu-trigger class exists", css.includes(".nav-menu-trigger::before"));
assert("Left accent on menu items", css.includes(".nav-menu-item::after"));
assert("Underline accent on triggers", css.includes(".nav-menu-trigger::after"));
assert("Menu items use cyan hover wash", css.includes("var(--immifin-menu-hover-cyan)"));
assert("Triggers use soft cyan wash", css.includes("var(--immifin-menu-hover-cyan-soft)"));
assert("Reduced motion disables menu slide", /prefers-reduced-motion[\s\S]*nav-menu-item/.test(css));
assert("Section headings remain nav-submenu-group", css.includes(".nav-submenu-group"));
assert("Legacy menu gold hover tokens removed", !css.includes("--immifin-menu-hover-gold:"));
assert("Transparent hover base (no solid fill under sweep)", /\.nav-menu-item:hover[\s\S]*?background-color:\s*transparent/.test(css));

assert("Header top links use nav-menu-trigger", header.includes("nav-menu-trigger"));
assert("Header submenu items use nav-menu-item", header.includes("navMenuItemClassName"));
assert("Header no longer uses hover:bg-brand-50 on menu rows", !header.includes("hover:bg-brand-50"));
assert("Section headings still use nav-submenu-group", header.includes("nav-submenu-group"));
assert("Premium preview buttons still present", header.includes("PremiumMenuButton"));
assert("ProBadge still rendered", header.includes("<ProBadge />"));

assert("Favorites trigger uses nav-menu-trigger", favorites.includes("nav-menu-trigger"));
assert("Favorites rows use nav-menu-item", favorites.includes("nav-menu-item"));

if (process.exitCode) {
  console.error("\nS7-DS-002 menu sweep verification failed.");
  process.exit(process.exitCode);
}

console.log("\nAll S7-DS-002 menu sweep checks passed.");
