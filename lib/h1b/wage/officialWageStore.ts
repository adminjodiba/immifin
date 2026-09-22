import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";
import {
  OFLC_ALL_INDUSTRIES_DATA_SOURCE,
  type OfficialWageLookupStore,
} from "@/lib/h1b/wage/officialWageLookup.types";

type WageDatasetRow = {
  id: string;
  wage_year: string;
  data_source: string;
  bls_survey: string | null;
  soc_version: string | null;
  effective_start: string;
  effective_end: string;
  status: string;
};

type OccupationRow = {
  soc_code: string;
  title: string;
};

type AreaRow = {
  area_code: string;
  area_name: string;
};

type WageRow = {
  soc_code: string;
  geo_level: number;
  label: string | null;
  level1: number | string | null;
  level2: number | string | null;
  level3: number | string | null;
  level4: number | string | null;
  average: number | string | null;
};

const ACTIVE_DATASET_FIELDS =
  "id, wage_year, data_source, bls_survey, soc_version, effective_start, effective_end, status" as const;
const OCCUPATION_FIELDS = "soc_code, title" as const;
const AREA_FIELDS = "area_code, area_name" as const;
const WAGE_FIELDS = "soc_code, geo_level, label, level1, level2, level3, level4, average" as const;

function officialDecimal(value: number | string | null): number | null {
  if (value === null) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function createSupabaseOfficialWageStore(): OfficialWageLookupStore {
  return {
    async loadActiveAllIndustriesDatasets() {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("wage_datasets")
        .select(ACTIVE_DATASET_FIELDS)
        .eq("status", "active")
        .eq("data_source", OFLC_ALL_INDUSTRIES_DATA_SOURCE);

      if (error) {
        throw new Error(`Failed to load active All Industries wage dataset: ${error.message}`);
      }

      return ((data ?? []) as WageDatasetRow[]).map((row) => ({
        id: row.id,
        wageYear: row.wage_year,
        dataSource: row.data_source,
        blsSurvey: row.bls_survey,
        socVersion: row.soc_version,
        effectiveStart: row.effective_start,
        effectiveEnd: row.effective_end,
      }));
    },

    async loadOccupation(datasetId, socCode) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("oflc_occupations")
        .select(OCCUPATION_FIELDS)
        .eq("dataset_id", datasetId)
        .eq("soc_code", socCode)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load official OFLC occupation: ${error.message}`);
      }
      if (!data) return null;
      const row = data as OccupationRow;
      return { socCode: row.soc_code, title: row.title };
    },

    async loadArea(datasetId, areaCode) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("oflc_areas")
        .select(AREA_FIELDS)
        .eq("dataset_id", datasetId)
        .eq("area_code", areaCode)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load official OFLC area: ${error.message}`);
      }
      if (!data) return null;
      const row = data as AreaRow;
      return { areaCode: row.area_code, areaName: row.area_name };
    },

    async loadWageRecord(datasetId, areaCode, socCode) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("oflc_wage_records")
        .select(WAGE_FIELDS)
        .eq("dataset_id", datasetId)
        .eq("data_source", OFLC_ALL_INDUSTRIES_DATA_SOURCE)
        .eq("area_code", areaCode)
        .eq("soc_code", socCode)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load official OFLC wage record: ${error.message}`);
      }
      if (!data) return null;
      const row = data as WageRow;
      return {
        socCode: row.soc_code,
        geoLevel: row.geo_level,
        label: row.label,
        level1: officialDecimal(row.level1),
        level2: officialDecimal(row.level2),
        level3: officialDecimal(row.level3),
        level4: officialDecimal(row.level4),
        average: officialDecimal(row.average),
      };
    },
  };
}
