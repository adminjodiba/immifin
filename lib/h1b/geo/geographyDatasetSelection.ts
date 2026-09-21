/**
 * Pure HUD + OFLC dataset selection for geographic resolution.
 * Does not look up ZIP, county, area, or wages.
 */

import {
  APPROVED_GEOGRAPHY_DATASET_PAIR,
  GEOGRAPHY_DATASET_REASON,
  type ApprovedGeographyDatasetPair,
  type GeographyDatasetReasonCode,
} from "@/lib/h1b/geo/approvedGeographyDatasetPair";

export type HudVersionCandidate = {
  versionId: string;
  year: number;
  quarter: number;
  packageSha256: string | null;
  status: string;
};

export type OflcDatasetCandidate = {
  datasetId: string;
  wageYear: string;
  dataSource: string;
  packageSha256: string | null;
  status: string;
};

export type ApprovedGeographyDatasetContext = {
  ok: true;
  hud: {
    versionId: string;
    year: number;
    quarter: number;
    packageSha256: string | null;
  };
  oflc: {
    datasetId: string;
    wageYear: string;
    dataSource: string;
    packageSha256: string | null;
  };
  compatibilityPolicy: ApprovedGeographyDatasetPair;
};

export type GeographyDatasetSelectionFailure = {
  ok: false;
  reasonCode: GeographyDatasetReasonCode;
};

export type GeographyDatasetSelectionResult =
  | ApprovedGeographyDatasetContext
  | GeographyDatasetSelectionFailure;

const ACTIVE_STATUS = "active";

function fail(reasonCode: GeographyDatasetReasonCode): GeographyDatasetSelectionFailure {
  return { ok: false, reasonCode };
}

function isActive(status: string): boolean {
  return status === ACTIVE_STATUS;
}

function matchesApprovedHud(
  hud: HudVersionCandidate,
  policy: ApprovedGeographyDatasetPair,
): boolean {
  return hud.year === policy.hud.year && hud.quarter === policy.hud.quarter;
}

function matchesApprovedOflc(
  oflc: OflcDatasetCandidate,
  policy: ApprovedGeographyDatasetPair,
): boolean {
  return oflc.wageYear === policy.oflc.wageYear && oflc.dataSource === policy.oflc.dataSource;
}

export function evaluateApprovedGeographyDatasets(input: {
  hudVersions: readonly HudVersionCandidate[];
  oflcDatasets: readonly OflcDatasetCandidate[];
  policy?: ApprovedGeographyDatasetPair;
}): GeographyDatasetSelectionResult {
  const policy = input.policy ?? APPROVED_GEOGRAPHY_DATASET_PAIR;

  const activeHud = input.hudVersions.filter((row) => isActive(row.status));
  const activeApprovedSourceOflc = input.oflcDatasets.filter(
    (row) => isActive(row.status) && row.dataSource === policy.oflc.dataSource,
  );

  if (activeHud.length !== 1 || activeApprovedSourceOflc.length !== 1) {
    return fail(GEOGRAPHY_DATASET_REASON.INACTIVE);
  }

  const hud = activeHud[0];
  const oflc = activeApprovedSourceOflc[0];
  if (!hud || !oflc) {
    return fail(GEOGRAPHY_DATASET_REASON.INACTIVE);
  }

  if (!matchesApprovedHud(hud, policy) || !matchesApprovedOflc(oflc, policy)) {
    return fail(GEOGRAPHY_DATASET_REASON.INCOMPATIBLE);
  }

  return {
    ok: true,
    hud: {
      versionId: hud.versionId,
      year: hud.year,
      quarter: hud.quarter,
      packageSha256: hud.packageSha256,
    },
    oflc: {
      datasetId: oflc.datasetId,
      wageYear: oflc.wageYear,
      dataSource: oflc.dataSource,
      packageSha256: oflc.packageSha256,
    },
    compatibilityPolicy: policy,
  };
}
