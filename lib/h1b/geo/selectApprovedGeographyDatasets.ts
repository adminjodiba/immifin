import "server-only";

import {
  APPROVED_GEOGRAPHY_DATASET_PAIR,
} from "@/lib/h1b/geo/approvedGeographyDatasetPair";
import {
  evaluateApprovedGeographyDatasets,
  type GeographyDatasetSelectionResult,
  type HudVersionCandidate,
  type OflcDatasetCandidate,
} from "@/lib/h1b/geo/geographyDatasetSelection";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const HUD_VERSION_FIELDS = "id, hud_year, hud_quarter, package_sha256, status" as const;
const OFLC_DATASET_FIELDS = "id, wage_year, data_source, package_sha256, status" as const;

type HudVersionRow = {
  id: string;
  hud_year: number;
  hud_quarter: number;
  package_sha256: string | null;
  status: string;
};

type OflcDatasetRow = {
  id: string;
  wage_year: string;
  data_source: string;
  package_sha256: string | null;
  status: string;
};

function mapHudVersion(row: HudVersionRow): HudVersionCandidate {
  return {
    versionId: row.id,
    year: row.hud_year,
    quarter: row.hud_quarter,
    packageSha256: row.package_sha256,
    status: row.status,
  };
}

function mapOflcDataset(row: OflcDatasetRow): OflcDatasetCandidate {
  return {
    datasetId: row.id,
    wageYear: row.wage_year,
    dataSource: row.data_source,
    packageSha256: row.package_sha256,
    status: row.status,
  };
}

/**
 * Server-only authority for the approved HUD + OFLC geographic-resolution pair.
 * Fail closed when the pair is inactive or incompatible. Does not activate datasets.
 */
export async function selectApprovedGeographyDatasets(): Promise<GeographyDatasetSelectionResult> {
  const supabase = getSupabaseAdminClient();
  const approvedSource = APPROVED_GEOGRAPHY_DATASET_PAIR.oflc.dataSource;

  const [hudResult, oflcResult] = await Promise.all([
    supabase
      .from("zip_crosswalk_versions")
      .select(HUD_VERSION_FIELDS)
      .eq("status", "active"),
    supabase
      .from("wage_datasets")
      .select(OFLC_DATASET_FIELDS)
      .eq("status", "active")
      .eq("data_source", approvedSource),
  ]);

  if (hudResult.error) {
    throw new Error(`Failed to load active HUD crosswalk versions: ${hudResult.error.message}`);
  }
  if (oflcResult.error) {
    throw new Error(`Failed to load active OFLC wage datasets: ${oflcResult.error.message}`);
  }

  return evaluateApprovedGeographyDatasets({
    hudVersions: ((hudResult.data ?? []) as HudVersionRow[]).map(mapHudVersion),
    oflcDatasets: ((oflcResult.data ?? []) as OflcDatasetRow[]).map(mapOflcDataset),
  });
}
