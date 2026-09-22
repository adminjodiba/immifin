import "server-only";

import { OFLC_ALL_INDUSTRIES_DATA_SOURCE } from "@/lib/h1b/wage/officialWageLookup.types";
import type { OfficialOccupationSearchStore } from "@/lib/h1b/occupations/officialOccupationSearch.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type WageDatasetRow = {
  id: string;
};

type OccupationRow = {
  soc_code: string;
  title: string;
};

export function createSupabaseOfficialOccupationSearchStore(): OfficialOccupationSearchStore {
  return {
    async loadActiveAllIndustriesDatasets() {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("wage_datasets")
        .select("id")
        .eq("status", "active")
        .eq("data_source", OFLC_ALL_INDUSTRIES_DATA_SOURCE);

      if (error) {
        throw new Error(`Failed to load active All Industries wage dataset: ${error.message}`);
      }

      return ((data ?? []) as WageDatasetRow[]).map((row) => ({ id: row.id }));
    },

    async loadOccupations(datasetId) {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("oflc_occupations")
        .select("soc_code, title")
        .eq("dataset_id", datasetId);

      if (error) {
        throw new Error(`Failed to load official OFLC occupations: ${error.message}`);
      }

      return ((data ?? []) as OccupationRow[]).map((row) => ({
        socCode: row.soc_code,
        title: row.title,
      }));
    },
  };
}
