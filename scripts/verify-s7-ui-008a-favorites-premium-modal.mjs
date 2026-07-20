/**
 * S7-UI-008A — Favorites premium popup uses shared viewport-level modal host.
 * Run: npx tsx scripts/verify-s7-ui-008a-favorites-premium-modal.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  getPremiumNavPreviewContent,
  PREMIUM_NAV_PREVIEWS,
} from "../lib/premium-nav-preview.ts";
import { CAPABILITY } from "../lib/subscription/capabilities.ts";

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
  assert("Shared dialog uses createPortal", dialogSource.includes("createPortal"));
  assert("Shared dialog portals to document.body", dialogSource.includes("document.body"));
  assert("Shared dialog is fixed inset full viewport", dialogSource.includes("fixed inset-0"));
  assert("Shared dialog uses z-[100]", dialogSource.includes("z-[100]"));

  const favorites = getPremiumNavPreviewContent("favorites");
  assert("Favorites preview key exists", Boolean(PREMIUM_NAV_PREVIEWS.favorites));
  assert("Title is Unlock Favorites", favorites.title === "Unlock Favorites");
  assert("Capability is favorites", favorites.capability === CAPABILITY.favorites);
  assert(
    "Description mentions Favorites menu",
    /favorites menu/i.test(favorites.description),
  );
  assert(
    "Benefits include quick access from navigation",
    favorites.benefits.some((b) => /quick access from navigation/i.test(b)),
  );

  const favoritesNavSource = readFileSync(
    resolve("components/favorites/FavoritesNavDropdown.tsx"),
    "utf8",
  );
  assert(
    "Desktop Favorites does not render FavoritesProGateDialog",
    !favoritesNavSource.includes("FavoritesProGateDialog"),
  );
  assert(
    "Desktop Free path emits favorites preview",
    favoritesNavSource.includes('onOpenPreview("favorites")'),
  );
  assert(
    "Mobile Free path emits favorites preview",
    (favoritesNavSource.match(/onOpenPreview\("favorites"\)/g) || []).length >= 2,
  );

  const headerSource = readFileSync(resolve("components/Header.tsx"), "utf8");
  assert(
    "Header hosts PremiumNavPreviewDialog after header",
    /<\/header>\s*<PremiumNavPreviewDialog/.test(headerSource.replace(/\r\n/g, "\n")),
  );
  assert(
    "Header passes openPreview into FavoritesNavDropdown",
    headerSource.includes("<FavoritesNavDropdown onOpenPreview={openPreview}"),
  );
  assert(
    "Header mobile Favorites uses openPreviewFromMobile",
    headerSource.includes("onOpenPreview={openPreviewFromMobile}"),
  );

  console.log("\nAll S7-UI-008A Favorites premium modal checks passed.");
}

main();
