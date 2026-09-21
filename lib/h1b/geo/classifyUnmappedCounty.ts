import type { UnmappedCountyClass } from "@/lib/h1b/geo/geographyResolution.types";

/** Contract §17: official placeholder GEOIDs `00048` / `00060` / `00064` / `00068` / `00070` / `000xx`. */
const PLACEHOLDER_GEOID = /^000[0-9]{2}$/;

/**
 * Census/HUD territory FIPS prefixes used when OFLC localities expose no joinable county_fips.
 * Not a ZIP hard-code. Equivalent to the contract GU/VI (and related) unjoined-FIPS class.
 */
const TERRITORY_FIPS_PREFIX = new Set(["60", "66", "69", "72", "78"]);
const TERRITORY_PREF_STATE = new Set(["AS", "GU", "MP", "PR", "VI"]);

export function classifyUnmappedCounty(
  countyFips: string,
  prefState: string | null,
): UnmappedCountyClass {
  if (PLACEHOLDER_GEOID.test(countyFips)) {
    return "placeholder_geoid";
  }
  const state = (prefState ?? "").trim().toUpperCase();
  if (TERRITORY_FIPS_PREFIX.has(countyFips.slice(0, 2)) || TERRITORY_PREF_STATE.has(state)) {
    return "territory_unjoined";
  }
  return "missing_oflc_fips";
}

export function fullyUnmappedReasonCode(
  classes: readonly UnmappedCountyClass[],
):
  | "UNAVAILABLE_PLACEHOLDER_GEOID"
  | "UNAVAILABLE_TERRITORY_UNJOINED"
  | "UNAVAILABLE_NO_MAPPED_COUNTY" {
  if (classes.length > 0 && classes.every((item) => item === "placeholder_geoid")) {
    return "UNAVAILABLE_PLACEHOLDER_GEOID";
  }
  if (classes.length > 0 && classes.every((item) => item === "territory_unjoined")) {
    return "UNAVAILABLE_TERRITORY_UNJOINED";
  }
  return "UNAVAILABLE_NO_MAPPED_COUNTY";
}
