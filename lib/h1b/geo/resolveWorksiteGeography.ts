import "server-only";

import { selectApprovedGeographyDatasets } from "@/lib/h1b/geo/selectApprovedGeographyDatasets";
import {
  orchestrateGeographyResolution,
  type GeographyResolutionStore,
} from "@/lib/h1b/geo/orchestrateGeographyResolution";
import type {
  OfficialHudCountyRow,
  OflcCountyMapping,
  ResolveGeographyInput,
} from "@/lib/h1b/geo/geographyResolution.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type HudCrosswalkRow = {
  county_fips: string;
  pref_state: string | null;
};

type OflcLocalityRow = {
  county_fips: string;
  county_town_name: string;
  state_ab: string;
  state_name: string;
  area_code: string;
};

type OflcAreaRow = {
  area_code: string;
  area_name: string;
};

const HUD_COUNTY_FIELDS = "county_fips, pref_state" as const;
const OFLC_LOCALITY_FIELDS = "county_fips, county_town_name, state_ab, state_name, area_code" as const;
const OFLC_AREA_FIELDS = "area_code, area_name" as const;

function createSupabaseGeographyStore(): GeographyResolutionStore {
  return {
    async loadOfficialHudCounties(input) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("zip_county_crosswalk")
        .select(HUD_COUNTY_FIELDS)
        .eq("crosswalk_version", input.hudVersionId)
        .eq("zip", input.zipNormalized);

      if (error) {
        throw new Error(`Failed to load official HUD ZIP counties: ${error.message}`);
      }

      return ((data ?? []) as HudCrosswalkRow[]).map((row) => ({
        countyFips: row.county_fips,
        prefState: row.pref_state,
      })) satisfies OfficialHudCountyRow[];
    },

    async loadOflcMappings(input) {
      if (input.countyFips.length === 0) {
        return [];
      }

      const supabase = getSupabaseAdminClient();
      const { data: localityData, error: localityError } = await supabase
        .from("oflc_area_localities")
        .select(OFLC_LOCALITY_FIELDS)
        .eq("dataset_id", input.oflcDatasetId)
        .in("county_fips", [...input.countyFips]);

      if (localityError) {
        throw new Error(`Failed to load OFLC county localities: ${localityError.message}`);
      }

      const localities = (localityData ?? []) as OflcLocalityRow[];
      const areaCodes = [...new Set(localities.map((row) => row.area_code))];
      if (areaCodes.length === 0) {
        return [];
      }

      const { data: areaData, error: areaError } = await supabase
        .from("oflc_areas")
        .select(OFLC_AREA_FIELDS)
        .eq("dataset_id", input.oflcDatasetId)
        .in("area_code", areaCodes);

      if (areaError) {
        throw new Error(`Failed to load OFLC area names: ${areaError.message}`);
      }

      const areaNames = new Map(
        ((areaData ?? []) as OflcAreaRow[]).map((row) => [row.area_code, row.area_name]),
      );

      return localities.map((row) => ({
        countyFips: row.county_fips,
        countyTownName: row.county_town_name,
        stateAb: row.state_ab,
        stateName: row.state_name,
        areaCode: row.area_code,
        areaName: areaNames.get(row.area_code) ?? "",
      })) satisfies OflcCountyMapping[];
    },
  };
}

/**
 * Server-only geographic resolver. Calls the IMPL-005 dataset guard first.
 * Does not activate datasets. Does not look up wages.
 */
export async function resolveWorksiteGeography(input: ResolveGeographyInput) {
  return orchestrateGeographyResolution(input, {
    selectDatasets: selectApprovedGeographyDatasets,
    store: createSupabaseGeographyStore(),
  });
}
