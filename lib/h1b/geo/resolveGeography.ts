/**
 * Pure Scenario A ZIP → HUD county → OFLC area classification.
 * Independently testable. Does not access a database.
 */

import type { ApprovedGeographyDatasetContext } from "@/lib/h1b/geo/geographyDatasetSelection";
import type { GeographyDatasetSelectionResult } from "@/lib/h1b/geo/geographyDatasetSelection";
import { APPROVED_GEOGRAPHY_DATASET_PAIR } from "@/lib/h1b/geo/approvedGeographyDatasetPair";
import { classifyUnmappedCounty, fullyUnmappedReasonCode } from "@/lib/h1b/geo/classifyUnmappedCounty";
import {
  GEOGRAPHY_CONTRACT_ID,
  GEOGRAPHY_PRODUCT_DECISION_ID,
  GEOGRAPHY_REASON,
  GEOGRAPHY_RESOLUTION_POLICY,
  type CountyOption,
  type GeographyReasonCode,
  type GeographyResolution,
  type OfficialHudCountyRow,
  type OflcCountyMapping,
  type ResolutionProvenance,
  type ResolveGeographyInput,
  type UnmappedCounty,
} from "@/lib/h1b/geo/geographyResolution.types";
import { normalizeCountyFips } from "@/lib/h1b/geo/normalizeCountyFips";
import { normalizeWorksiteZip } from "@/lib/h1b/geo/normalizeWorksiteZip";

export type OflcCountyIndex = ReadonlyMap<string, readonly OflcCountyMapping[]>;

export type EvaluateGeographyInput = ResolveGeographyInput & {
  datasetSelection: GeographyDatasetSelectionResult;
  hudRows: readonly OfficialHudCountyRow[];
  oflcIndex: OflcCountyIndex;
};

function emptyCounts() {
  return {
    officialCountyCount: 0,
    mappedCountyCount: 0,
    unmappedCountyCount: 0,
    distinctAreaCount: 0,
    mappedCounties: [] as CountyOption[],
    unmappedOfficialCounties: [] as UnmappedCounty[],
    resolvedArea: null,
    choiceOptions: [] as CountyOption[],
    selectedCountyFips: null,
  };
}

function provenanceFromSelection(
  zipNormalized: string,
  selection: GeographyDatasetSelectionResult,
): ResolutionProvenance {
  if (!selection.ok) {
    return {
      contractId: GEOGRAPHY_CONTRACT_ID,
      productDecisionId: GEOGRAPHY_PRODUCT_DECISION_ID,
      resolutionPolicy: GEOGRAPHY_RESOLUTION_POLICY,
      hudCrosswalkVersionId: null,
      hudYear: null,
      hudQuarter: null,
      hudPackageSha256: null,
      oflcDatasetId: null,
      oflcWageYear: null,
      oflcPackageSha256: null,
      compatibilityPolicy: APPROVED_GEOGRAPHY_DATASET_PAIR,
      zipNormalized,
    };
  }
  return provenanceFromContext(zipNormalized, selection);
}

function provenanceFromContext(
  zipNormalized: string,
  context: ApprovedGeographyDatasetContext,
): ResolutionProvenance {
  return {
    contractId: GEOGRAPHY_CONTRACT_ID,
    productDecisionId: GEOGRAPHY_PRODUCT_DECISION_ID,
    resolutionPolicy: GEOGRAPHY_RESOLUTION_POLICY,
    hudCrosswalkVersionId: context.hud.versionId,
    hudYear: context.hud.year,
    hudQuarter: context.hud.quarter,
    hudPackageSha256: context.hud.packageSha256,
    oflcDatasetId: context.oflc.datasetId,
    oflcWageYear: context.oflc.wageYear,
    oflcPackageSha256: context.oflc.packageSha256,
    compatibilityPolicy: context.compatibilityPolicy,
    zipNormalized,
  };
}

function result(partial: Omit<GeographyResolution, "provenance"> & { provenance: ResolutionProvenance }): GeographyResolution {
  return partial;
}

function toCountyOption(mapping: OflcCountyMapping): CountyOption {
  return {
    countyFips: mapping.countyFips,
    countyDisplayName: mapping.countyTownName,
    stateAb: mapping.stateAb,
    stateDisplayName: mapping.stateName,
    areaCode: mapping.areaCode,
    areaName: mapping.areaName,
  };
}

function compareFips(a: string, b: string): number {
  return a.localeCompare(b);
}

function unavailable(
  input: EvaluateGeographyInput,
  zipRaw: string,
  zipNormalized: string,
  reasonCode: GeographyReasonCode,
  extras: Partial<GeographyResolution> = {},
): GeographyResolution {
  return result({
    outcome: "UNAVAILABLE",
    reasonCode,
    zipRaw,
    zipNormalized,
    ...emptyCounts(),
    provenance: provenanceFromSelection(zipNormalized, input.datasetSelection),
    ...extras,
  });
}

export function evaluateGeographyResolution(input: EvaluateGeographyInput): GeographyResolution {
  void input.areaCode;
  const zipRaw = typeof input.zip === "string" ? input.zip : "";
  const zip = normalizeWorksiteZip(input.zip);
  if (!zip.ok) {
    return unavailable(input, zipRaw, "", GEOGRAPHY_REASON.INVALID_ZIP);
  }

  const county = normalizeCountyFips(input.countyFips);
  if (!county.ok) {
    return unavailable(input, zipRaw, zip.zipNormalized, GEOGRAPHY_REASON.INVALID_COUNTY_FIPS);
  }

  if (!input.datasetSelection.ok) {
    return unavailable(input, zipRaw, zip.zipNormalized, input.datasetSelection.reasonCode);
  }

  const hudRows = input.hudRows;
  if (hudRows.length === 0) {
    return unavailable(input, zipRaw, zip.zipNormalized, GEOGRAPHY_REASON.UNAVAILABLE_NO_HUD_ZIP);
  }

  const mappedCounties: CountyOption[] = [];
  const unmappedOfficialCounties: UnmappedCounty[] = [];
  const distinctAreas = new Map<string, { areaCode: string; areaName: string }>();

  for (const row of hudRows) {
    const mappings = input.oflcIndex.get(row.countyFips) ?? [];
    if (mappings.length === 0) {
      unmappedOfficialCounties.push({
        countyFips: row.countyFips,
        hudPrefState: row.prefState,
        unmappedClass: classifyUnmappedCounty(row.countyFips, row.prefState),
      });
      continue;
    }
    const areaCodes = new Set(mappings.map((item) => item.areaCode));
    if (areaCodes.size > 1) {
      return unavailable(
        input,
        zipRaw,
        zip.zipNormalized,
        GEOGRAPHY_REASON.UNAVAILABLE_DATASET_INCOMPATIBLE,
        {
          officialCountyCount: hudRows.length,
          mappedCountyCount: mappedCounties.length,
          unmappedCountyCount: unmappedOfficialCounties.length,
        },
      );
    }
    const mapping = mappings[0];
    if (!mapping) {
      unmappedOfficialCounties.push({
        countyFips: row.countyFips,
        hudPrefState: row.prefState,
        unmappedClass: classifyUnmappedCounty(row.countyFips, row.prefState),
      });
      continue;
    }
    mappedCounties.push(toCountyOption(mapping));
    distinctAreas.set(mapping.areaCode, {
      areaCode: mapping.areaCode,
      areaName: mapping.areaName,
    });
  }

  mappedCounties.sort((a, b) => compareFips(a.countyFips, b.countyFips));
  unmappedOfficialCounties.sort((a, b) => compareFips(a.countyFips, b.countyFips));

  const officialCountyCount = hudRows.length;
  const mappedCountyCount = mappedCounties.length;
  const unmappedCountyCount = unmappedOfficialCounties.length;
  const distinctAreaCount = distinctAreas.size;
  const provenance = provenanceFromContext(zip.zipNormalized, input.datasetSelection);

  if (!county.omitted) {
    const selected = county.countyFips;
    const official = hudRows.some((row) => row.countyFips === selected);
    if (!official) {
      return result({
        outcome: "UNAVAILABLE",
        reasonCode: GEOGRAPHY_REASON.INVALID_COUNTY_FOR_ZIP,
        zipRaw,
        zipNormalized: zip.zipNormalized,
        selectedCountyFips: null,
        officialCountyCount,
        mappedCountyCount,
        unmappedCountyCount,
        distinctAreaCount,
        mappedCounties,
        unmappedOfficialCounties,
        resolvedArea: null,
        choiceOptions: [],
        provenance,
      });
    }
    const selectedMapping = mappedCounties.find((item) => item.countyFips === selected);
    if (!selectedMapping) {
      return result({
        outcome: "UNAVAILABLE",
        reasonCode: GEOGRAPHY_REASON.COUNTY_UNMAPPED,
        zipRaw,
        zipNormalized: zip.zipNormalized,
        selectedCountyFips: null,
        officialCountyCount,
        mappedCountyCount,
        unmappedCountyCount,
        distinctAreaCount,
        mappedCounties,
        unmappedOfficialCounties,
        resolvedArea: null,
        choiceOptions: [],
        provenance,
      });
    }
    return result({
      outcome: "AUTO",
      reasonCode: GEOGRAPHY_REASON.AUTO_SINGLE_AREA,
      zipRaw,
      zipNormalized: zip.zipNormalized,
      selectedCountyFips: selected,
      officialCountyCount,
      mappedCountyCount,
      unmappedCountyCount,
      distinctAreaCount,
      mappedCounties,
      unmappedOfficialCounties,
      resolvedArea: {
        areaCode: selectedMapping.areaCode,
        areaName: selectedMapping.areaName,
      },
      choiceOptions: [],
      provenance,
    });
  }

  if (unmappedCountyCount > 0 && mappedCountyCount > 0) {
    return result({
      outcome: "UNAVAILABLE",
      reasonCode: GEOGRAPHY_REASON.PARTIAL_OFFICIAL_COUNTY_UNMAPPED,
      zipRaw,
      zipNormalized: zip.zipNormalized,
      selectedCountyFips: null,
      officialCountyCount,
      mappedCountyCount,
      unmappedCountyCount,
      distinctAreaCount,
      mappedCounties,
      unmappedOfficialCounties,
      resolvedArea: null,
      choiceOptions: [],
      provenance,
    });
  }

  if (mappedCountyCount === 0) {
    return result({
      outcome: "UNAVAILABLE",
      reasonCode: fullyUnmappedReasonCode(unmappedOfficialCounties.map((item) => item.unmappedClass)),
      zipRaw,
      zipNormalized: zip.zipNormalized,
      selectedCountyFips: null,
      officialCountyCount,
      mappedCountyCount,
      unmappedCountyCount,
      distinctAreaCount,
      mappedCounties,
      unmappedOfficialCounties,
      resolvedArea: null,
      choiceOptions: [],
      provenance,
    });
  }

  if (distinctAreaCount === 1) {
    const area = [...distinctAreas.values()][0];
    return result({
      outcome: "AUTO",
      reasonCode: GEOGRAPHY_REASON.AUTO_SINGLE_AREA,
      zipRaw,
      zipNormalized: zip.zipNormalized,
      selectedCountyFips: null,
      officialCountyCount,
      mappedCountyCount,
      unmappedCountyCount,
      distinctAreaCount,
      mappedCounties,
      unmappedOfficialCounties,
      resolvedArea: area
        ? { areaCode: area.areaCode, areaName: area.areaName }
        : null,
      choiceOptions: [],
      provenance,
    });
  }

  return result({
    outcome: "CHOICE_REQUIRED",
    reasonCode: GEOGRAPHY_REASON.CHOICE_MULTIPLE_AREAS,
    zipRaw,
    zipNormalized: zip.zipNormalized,
    selectedCountyFips: null,
    officialCountyCount,
    mappedCountyCount,
    unmappedCountyCount,
    distinctAreaCount,
    mappedCounties,
    unmappedOfficialCounties,
    resolvedArea: null,
    choiceOptions: [...mappedCounties],
    provenance,
  });
}
