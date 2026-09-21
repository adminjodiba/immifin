/**
 * Dataset guard → authoritative row fetch → pure resolver.
 * Data-access functions are injected so this stays independently testable.
 */

import type { GeographyDatasetSelectionResult } from "@/lib/h1b/geo/geographyDatasetSelection";
import type {
  OfficialHudCountyRow,
  OflcCountyMapping,
  ResolveGeographyInput,
} from "@/lib/h1b/geo/geographyResolution.types";
import { evaluateGeographyResolution } from "@/lib/h1b/geo/resolveGeography";
import { normalizeCountyFips } from "@/lib/h1b/geo/normalizeCountyFips";
import { normalizeWorksiteZip } from "@/lib/h1b/geo/normalizeWorksiteZip";

export type GeographyResolutionStore = {
  loadOfficialHudCounties(input: {
    hudVersionId: string;
    zipNormalized: string;
  }): Promise<readonly OfficialHudCountyRow[]>;
  loadOflcMappings(input: {
    oflcDatasetId: string;
    countyFips: readonly string[];
  }): Promise<readonly OflcCountyMapping[]>;
};

function indexOflcMappings(mappings: readonly OflcCountyMapping[]): Map<string, OflcCountyMapping[]> {
  const index = new Map<string, OflcCountyMapping[]>();
  for (const mapping of mappings) {
    const current = index.get(mapping.countyFips) ?? [];
    current.push(mapping);
    index.set(mapping.countyFips, current);
  }
  return index;
}

export async function orchestrateGeographyResolution(
  input: ResolveGeographyInput,
  deps: {
    selectDatasets: () => Promise<GeographyDatasetSelectionResult>;
    store: GeographyResolutionStore;
  },
) {
  const zip = normalizeWorksiteZip(input.zip);
  const county = normalizeCountyFips(input.countyFips);
  if (!zip.ok || !county.ok) {
    return evaluateGeographyResolution({
      zip: input.zip,
      countyFips: input.countyFips,
      areaCode: input.areaCode,
      datasetSelection: {
        ok: false,
        reasonCode: "UNAVAILABLE_DATASET_INACTIVE",
      },
      hudRows: [],
      oflcIndex: new Map(),
    });
  }

  const datasetSelection = await deps.selectDatasets();
  if (!datasetSelection.ok) {
    return evaluateGeographyResolution({
      zip: input.zip,
      countyFips: input.countyFips,
      areaCode: input.areaCode,
      datasetSelection,
      hudRows: [],
      oflcIndex: new Map(),
    });
  }

  const hudRows = await deps.store.loadOfficialHudCounties({
    hudVersionId: datasetSelection.hud.versionId,
    zipNormalized: zip.zipNormalized,
  });
  const countyFips = hudRows.map((row) => row.countyFips);
  const mappings =
    countyFips.length === 0
      ? []
      : await deps.store.loadOflcMappings({
          oflcDatasetId: datasetSelection.oflc.datasetId,
          countyFips,
        });

  return evaluateGeographyResolution({
    zip: input.zip,
    countyFips: input.countyFips,
    areaCode: input.areaCode,
    datasetSelection,
    hudRows,
    oflcIndex: indexOflcMappings(mappings),
  });
}
