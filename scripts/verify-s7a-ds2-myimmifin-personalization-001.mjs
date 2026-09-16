/**
 * S7A-DS2-MYIMMIFIN-PERSONALIZATION-001 — start-page registry and rename checks.
 * Run: npx tsx scripts/verify-s7a-ds2-myimmifin-personalization-001.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  canCustomizeStartPage,
  getAvailableStartPageDestinations,
  POST_LOGIN_START_PATH,
  resolveAuthorizedStartPageHref,
} from "../lib/account/startPage.ts";
import { isGeneralLoginReturnPath, resolveLoginReturnPath } from "../lib/auth/signInRedirect.ts";
import { PROFILE_HUB_EXIT_PATH } from "../lib/onboarding/routes.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  const cssSource = readFileSync(resolve("app/globals.css"), "utf8");
  assert(
    "Three admin destinations use equal desktop columns",
    cssSource.includes('.ds2-personalization-options[data-count="3"]') &&
      cssSource.includes("repeat(3, minmax(0, 1fr))"),
  );

  const navSource = readFileSync(resolve("components/ds2/Ds2MyImmifinWorkspaceNav.tsx"), "utf8");
  assert("Sidebar label is Immigration Dashboard", navSource.includes('label: "Immigration Dashboard"'));
  assert("Sidebar includes Personalization", navSource.includes('href: "/user-profile/personalization"'));
  assert("Sidebar still uses /dashboard route", navSource.includes('href: "/dashboard"'));
  assert("Sidebar keeps existing help card", navSource.includes("Need help?"));

  const startRoute = readFileSync(resolve("app/auth/start/route.ts"), "utf8");
  const siteShell = readFileSync(resolve("components/SiteShell.tsx"), "utf8");
  assert("Post-login resolver is a route handler", startRoute.includes("export async function GET"));
  assert("Resolver never renders a page body", startRoute.includes("NextResponse.redirect"));
  assert("Resolver falls back to Home on failure", startRoute.includes('redirectTo(request, "/")'));
  assert("SiteShell treats /auth/start as chrome-free auth", siteShell.includes('pathname === "/auth/start"'));

  assert("Login fallback is /auth/start", PROFILE_HUB_EXIT_PATH === POST_LOGIN_START_PATH);
  assert("Home is a general login return", isGeneralLoginReturnPath("/"));
  assert("Billing is an explicit return", !isGeneralLoginReturnPath("/account/billing"));
  assert("General login resolves to start path", resolveLoginReturnPath("/") === POST_LOGIN_START_PATH);
  assert(
    "Explicit billing return is preserved",
    resolveLoginReturnPath("/account/billing") === "/account/billing",
  );

  const proContext = { canAccessPersonalDashboard: true, isAdmin: false };
  const adminContext = { canAccessPersonalDashboard: true, isAdmin: true };
  const freeContext = { canAccessPersonalDashboard: false, isAdmin: false };

  assert("Free cannot customize", !canCustomizeStartPage("free"));
  assert("Pro can customize", canCustomizeStartPage("pro"));
  assert("Power can customize", canCustomizeStartPage("power"));

  const proDestinations = getAvailableStartPageDestinations(proContext).map((item) => item.id);
  assert("Pro sees Home", proDestinations.includes("home"));
  assert("Pro sees Immigration Dashboard", proDestinations.includes("immigration-dashboard"));
  assert("Pro does not see Admin", !proDestinations.includes("admin-dashboard"));
  assert(
    "Finance is not registered",
    !getAvailableStartPageDestinations(adminContext).some((item) => item.id === "finance-dashboard"),
  );

  const adminDestinations = getAvailableStartPageDestinations(adminContext).map((item) => item.id);
  assert("Admin sees Admin Dashboard", adminDestinations.includes("admin-dashboard"));

  assert(
    "Missing preference falls back to Home",
    resolveAuthorizedStartPageHref(null, proContext) === "/",
  );
  assert(
    "Unauthorized immigration preference falls back to Home",
    resolveAuthorizedStartPageHref("immigration-dashboard", freeContext) === "/",
  );
  assert(
    "Unauthorized admin preference falls back to Home",
    resolveAuthorizedStartPageHref("admin-dashboard", proContext) === "/",
  );
  assert(
    "Authorized immigration preference resolves to /dashboard",
    resolveAuthorizedStartPageHref("immigration-dashboard", proContext) === "/dashboard",
  );
  assert(
    "Authorized admin preference resolves to /admin",
    resolveAuthorizedStartPageHref("admin-dashboard", adminContext) === "/admin",
  );

  console.log("\nS7A-DS2-MYIMMIFIN-PERSONALIZATION-001 verify: PASS");
}

main();
