/**
 * S7-UI-012 — Contact Us page + About submenu.
 * Run: npx tsx scripts/verify-s7-ui-012-contact-page.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { aboutMenuLinks, aboutMenuSections } from "../lib/about-menu.ts";
import { contactConfig } from "../lib/contact.ts";
import { navLinks } from "../lib/site.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  const aboutNav = navLinks.find((l) => l.href === "/about");
  assert("About is top-level nav item", Boolean(aboutNav));
  assert("About has dropdown", Boolean(aboutNav?.hasDropdown));

  assert(
    "About menu has About IMMIFIN and Contact Us",
    aboutMenuLinks.map((i) => i.label).join("|") === "About IMMIFIN|Contact Us",
  );
  assert(
    "Contact Us resolves to /contact",
    aboutMenuLinks.some((i) => i.label === "Contact Us" && i.href === "/contact"),
  );
  assert(
    "About IMMIFIN resolves to /about",
    aboutMenuLinks.some((i) => i.label === "About IMMIFIN" && i.href === "/about"),
  );
  assert("About menu has one flat section", aboutMenuSections.length === 1);

  assert("supportEmail configured", contactConfig.supportEmail === "support@immifin.com");
  assert(
    "partnershipEmail configured",
    contactConfig.partnershipEmail === "partnerships@immifin.com",
  );
  assert("bugEmail configured", contactConfig.bugEmail === "bugs@immifin.com");
  assert("feedbackEmail configured", contactConfig.feedbackEmail === "feedback@immifin.com");
  assert("officeCity Dallas", contactConfig.officeCity === "Dallas");
  assert("officeState Texas", contactConfig.officeState === "Texas");
  assert("officeCountry United States", contactConfig.officeCountry === "United States");

  const pageSource = readFileSync(resolve("app/contact/page.tsx"), "utf8");
  assert("Contact page uses ContactUsForm", pageSource.includes("ContactUsForm"));
  assert("Contact metadata tags path /contact", pageSource.includes('path: "/contact"'));
  assert("Contact title is Contact Us", pageSource.includes('title: "Contact Us"'));
  assert("Contact page has no mailto channel cards", !pageSource.includes("mailto:"));

  const headerSource = readFileSync(resolve("components/Header.tsx"), "utf8");
  assert("Header builds About sections", headerSource.includes("buildAboutSections"));
  assert("Header desktop wires About dropdown", headerSource.includes('href === "/about"'));
  assert("Header imports about menu", headerSource.includes("aboutMenuSections"));

  console.log("\nAll S7-UI-012 Contact Us checks passed.");
}

main();
