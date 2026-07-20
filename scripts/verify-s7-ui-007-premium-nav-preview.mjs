/**
 * S7-UI-007 / S7-UI-007A — premium navigation preview content and Free-user interception.
 * Run: npx tsx scripts/verify-s7-ui-007-premium-nav-preview.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { immigrationMenuLinks } from "../lib/immigration-menu.ts";
import {
  getMyImmifinPremiumPreview,
  getVisibleMyImmifinMenuItems,
  isMyImmifinItemLocked,
} from "../lib/my-immifin-menu.ts";
import {
  getPremiumNavPreviewContent,
  PREMIUM_NAV_PREVIEWS,
} from "../lib/premium-nav-preview.ts";
import { CAPABILITY, hasCapability } from "../lib/subscription/capabilities.ts";

function assert(label, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${label}`);
  }
  console.log(`✓ ${label}`);
}

function main() {
  const dialogSource = readFileSync(
    resolve("components/common/PremiumNavPreviewDialog.tsx"),
    "utf8",
  );
  assert("Dialog uses createPortal", dialogSource.includes("createPortal"));
  assert("Dialog portals to document.body", dialogSource.includes("document.body"));
  assert("Dialog overlay is position fixed", dialogSource.includes("fixed inset-0"));

  const headerSource = readFileSync(resolve("components/Header.tsx"), "utf8");
  assert(
    "Dialog is not nested inside sticky header JSX closing tag before portal host",
    /<\/header>\s*<PremiumNavPreviewDialog/.test(headerSource.replace(/\r\n/g, "\n")),
  );

  const movement = immigrationMenuLinks.find(
    (item) => item.href === "/immigration/visa-bulletin-movement",
  );
  assert("Movement Tracker exists in Immigration menu", Boolean(movement));
  assert(
    "Movement Tracker has movementTracker preview metadata",
    movement?.premiumPreview === "movementTracker",
  );
  assert(
    "Movement Tracker remains visible (not removed for Free)",
    immigrationMenuLinks.some((item) => item.label.includes("Movement Tracker")),
  );

  const freeItems = getVisibleMyImmifinMenuItems("free");
  const dashboard = freeItems.find((item) => item.id === "dashboard");
  assert("Free My Immifin includes Dashboard", Boolean(dashboard));
  assert("Dashboard preview key is dashboard", dashboard?.premiumPreview === "dashboard");
  assert(
    "Free Dashboard opens preview (not locked disabled UX)",
    getMyImmifinPremiumPreview(dashboard, "free") === "dashboard",
  );
  assert(
    "Pro Dashboard navigates normally",
    getMyImmifinPremiumPreview(dashboard, "pro") === null,
  );
  assert(
    "Power Dashboard navigates normally",
    getMyImmifinPremiumPreview(dashboard, "power") === null,
  );

  const movementContent = getPremiumNavPreviewContent("movementTracker");
  assert(
    "Movement popup title is Unlock Movement Intelligence",
    movementContent.title === "Unlock Movement Intelligence",
  );
  assert(
    "Movement popup uses movement capability",
    movementContent.capability === CAPABILITY.movementTracker,
  );
  assert("Movement benefits are feature-specific", movementContent.benefits.length >= 5);
  assert(
    "Movement mentions monthly tracking",
    movementContent.benefits.some((b) => /monthly movement/i.test(b)),
  );

  const dashboardContent = getPremiumNavPreviewContent("dashboard");
  assert(
    "Dashboard popup title is personalized dashboard",
    dashboardContent.title === "Unlock Your Personalized Dashboard",
  );
  assert(
    "Dashboard popup uses personal dashboard capability",
    dashboardContent.capability === CAPABILITY.personalDashboard,
  );
  assert(
    "Dashboard content differs from Movement",
    dashboardContent.title !== movementContent.title,
  );
  assert(
    "Dashboard benefits mention personalized journey",
    dashboardContent.benefits.some((b) => /personalized immigration journey/i.test(b)),
  );

  assert("Free lacks movement capability", !hasCapability("free", CAPABILITY.movementTracker));
  assert("Free lacks dashboard capability", !hasCapability("free", CAPABILITY.personalDashboard));
  assert("Pro has movement capability", hasCapability("pro", CAPABILITY.movementTracker));
  assert("Pro has dashboard capability", hasCapability("pro", CAPABILITY.personalDashboard));
  assert("Power has movement capability", hasCapability("power", CAPABILITY.movementTracker));

  assert(
    "Deprecated locked helper aligns with preview for Free Dashboard",
    isMyImmifinItemLocked(dashboard, "free") === true,
  );
  assert(
    "Deprecated locked helper false for Pro Dashboard",
    isMyImmifinItemLocked(dashboard, "pro") === false,
  );

  assert(
    "Preview catalog has dashboard, favorites, movementTracker, and visaHistory",
    Object.keys(PREMIUM_NAV_PREVIEWS).sort().join(",") ===
      "dashboard,favorites,movementTracker,visaHistory",
  );

  const favoritesContent = getPremiumNavPreviewContent("favorites");
  assert("Favorites popup title is Unlock Favorites", favoritesContent.title === "Unlock Favorites");
  assert(
    "Favorites popup uses favorites capability",
    favoritesContent.capability === CAPABILITY.favorites,
  );
  assert(
    "Favorites content differs from Dashboard and Movement",
    favoritesContent.title !== movementContent.title &&
      favoritesContent.title !== dashboardContent.title,
  );
  assert("Favorites benefits are feature-specific", favoritesContent.benefits.length >= 4);

  const history = immigrationMenuLinks.find(
    (item) => item.href === "/immigration/visa-bulletin-history",
  );
  assert("Visa Bulletin History exists in Immigration menu", Boolean(history));
  assert(
    "Visa Bulletin History has visaHistory preview metadata",
    history?.premiumPreview === "visaHistory",
  );
  assert(
    "Visa Bulletin History label includes History",
    history?.label.includes("Visa Bulletin History"),
  );
  const historyContent = getPremiumNavPreviewContent("visaHistory");
  assert(
    "Visa History popup title is Unlock Visa Bulletin History",
    historyContent.title === "Unlock Visa Bulletin History",
  );
  assert(
    "Visa History popup uses visaHistory capability",
    historyContent.capability === CAPABILITY.visaHistory,
  );
  assert("Free lacks visa history capability", !hasCapability("free", CAPABILITY.visaHistory));
  assert("Pro has visa history capability", hasCapability("pro", CAPABILITY.visaHistory));

  const favoritesNavSource = readFileSync(
    resolve("components/favorites/FavoritesNavDropdown.tsx"),
    "utf8",
  );
  assert(
    "Favorites nav does not mount FavoritesProGateDialog",
    !favoritesNavSource.includes("FavoritesProGateDialog"),
  );
  assert(
    "Favorites nav emits favorites preview key",
    favoritesNavSource.includes('onOpenPreview("favorites")'),
  );
  assert(
    "Header wires Favorites to shared preview host",
    headerSource.includes("<FavoritesNavDropdown onOpenPreview={openPreview}"),
  );

  console.log("\nAll S7-UI-007 premium navigation preview checks passed.");
}

main();
