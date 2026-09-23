import { createHash } from "node:crypto";
import { loadDelimited, requireColumns } from "./csv";
import {
  buildGazetteerIndex,
  loadGazetteerCounties,
  resolveCountyFips,
} from "./geography";
import {
  EXPECTED_OFLC_2026_27,
  OFLC_ALL_INDUSTRIES_DATA_SOURCE,
  type ImportIssue,
  type OfficialLabelClass,
  type OflcAreaLocalityRecord,
  type OflcAreaRecord,
  type OflcImportResult,
  type OflcOccupationRecord,
  type OflcWageRecord,
  type WageDatasetRecord,
  type WageFixtureCheck,
} from "./types";

export const SOFTWARE_DEVELOPER_FIXTURES: Array<{
  name: string;
  area_code: string;
  expected: [string, string, string, string];
}> = [
  {
    name: "Houston 26420",
    area_code: "26420",
    expected: ["42.20", "53.05", "63.89", "74.74"],
  },
  {
    name: "San Francisco 41860",
    area_code: "41860",
    expected: ["65.91", "79.39", "92.86", "106.34"],
  },
  {
    name: "Seattle 42660",
    area_code: "42660",
    expected: ["53.66", "68.80", "83.94", "99.08"],
  },
  {
    name: "Northwest Texas 4800001",
    area_code: "4800001",
    expected: ["40.44", "51.01", "61.57", "72.14"],
  },
];

const SOFTWARE_DEVELOPER_SOC = "15-1252";
const SOC_CODE_RE = /^\d{2}-\d{4}$/;
const AREA_CODE_RE = /^\d{5,7}$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

export type ParseOflcPackageInput = {
  packageFilename: string;
  packageBytes?: Buffer;
  packageSha256?: string;
  occupationsCsv: string;
  geographyCsv: string;
  alcCsv: string;
  gazetteerText: string;
  notesText?: string | null;
  validateFixtures?: boolean;
  validatePackageIdentity?: boolean;
};

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function datasetIdFromSha(sha256: string): string {
  const h = sha256.toLowerCase().replace(/[^0-9a-f]/g, "").padEnd(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export function classifyOfficialLabel(label: string | null): OfficialLabelClass {
  if (label == null || label.trim() === "") return "blank";
  if (label === "Annual Wage") return "annual_wage";
  if (label === "High Wage") return "high_wage";
  if (label === "No Leveled Wage") return "no_leveled_wage";
  return "other";
}

function issue(
  severity: ImportIssue["severity"],
  code: string,
  message: string
): ImportIssue {
  return { severity, code, message };
}

function parseOfficialDecimal(
  raw: string,
  context: string,
  issues: ImportIssue[]
): { value: number | null; raw: string | null } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, raw: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    issues.push(issue("error", "invalid_wage_number", `${context}: not a number (${trimmed})`));
    return { value: null, raw: trimmed };
  }
  if (value < 0) {
    issues.push(issue("error", "negative_wage", `${context}: negative official wage ${trimmed}`));
  }
  return { value, raw: trimmed };
}

function validatePackageIdentity(
  filename: string,
  notesText: string | null | undefined,
  issues: ImportIssue[]
): void {
  if (filename !== EXPECTED_OFLC_2026_27.packageFilename) {
    issues.push(
      issue(
        "error",
        "package_filename",
        `Expected ${EXPECTED_OFLC_2026_27.packageFilename}, received ${filename}`
      )
    );
  }
  if (!notesText) {
    issues.push(
      issue(
        "warning",
        "notes_missing",
        "Technical notes were not supplied; wage year / BLS / SOC identity taken from package filename plus expected 2026-27 constants."
      )
    );
    return;
  }
  const compactNotes = notesText.replace(/\s+/g, " ");
  const requiredSnippets = [
    "Wage Year 2026-27",
    "July 1, 2026",
    "June 30, 2027",
    "May 2025",
    "2018 Standard Occupational Classification",
  ];
  for (const snippet of requiredSnippets) {
    if (!compactNotes.includes(snippet)) {
      issues.push(
        issue("error", "notes_identity", `Technical notes missing required identity text: ${snippet}`)
      );
    }
  }
}

export function parseOflcAllIndustriesPackage(
  input: ParseOflcPackageInput
): OflcImportResult {
  const issues: ImportIssue[] = [];
  const packageSha256 = (
    input.packageSha256 ??
    (input.packageBytes ? sha256Hex(input.packageBytes) : sha256Hex(Buffer.from(input.packageFilename)))
  ).toLowerCase();

  if (!SHA256_RE.test(packageSha256)) {
    issues.push(issue("error", "package_sha256", "Package SHA-256 is not a 64-character hex digest"));
  }

  if (input.validatePackageIdentity !== false) {
    validatePackageIdentity(input.packageFilename, input.notesText, issues);
  }

  const occsFile = loadDelimited(input.occupationsCsv);
  const geoFile = loadDelimited(input.geographyCsv);
  const alcFile = loadDelimited(input.alcCsv);

  const occCols = requireColumns(occsFile.header, ["soccode", "Title", "Description"], "oes_soc_occs.csv");
  const geoCols = requireColumns(
    geoFile.header,
    ["Area", "AreaName", "StateAb", "State", "CountyTownName"],
    "Geography.csv"
  );
  const alcCols = requireColumns(
    alcFile.header,
    ["Area", "SocCode", "GeoLvl", "Level1", "Level2", "Level3", "Level4", "Average", "Label"],
    "ALC_Export.csv"
  );
  for (const msg of [occCols, geoCols, alcCols]) {
    if (msg) issues.push(issue("error", "missing_columns", msg));
  }

  const datasetId = datasetIdFromSha(packageSha256);
  const occupations: OflcOccupationRecord[] = [];
  const seenSoc = new Set<string>();
  for (const row of occsFile.rows) {
    const soc_code = row.soccode ?? "";
    if (!SOC_CODE_RE.test(soc_code)) {
      issues.push(issue("error", "malformed_soc", `Occupation SOC is not TEXT ##-####: ${soc_code}`));
    }
    if (seenSoc.has(soc_code)) {
      issues.push(issue("error", "duplicate_occupation", `Duplicate occupation key ${soc_code}`));
      continue;
    }
    seenSoc.add(soc_code);
    if (!row.Title) {
      issues.push(issue("error", "occupation_title", `Occupation ${soc_code} has an empty title`));
    }
    occupations.push({
      dataset_id: datasetId,
      soc_code,
      title: row.Title ?? "",
      description: row.Description ? row.Description : null,
    });
  }

  let gazetteerIndex: Map<string, ReturnType<typeof loadGazetteerCounties>[number]>;
  try {
    gazetteerIndex = buildGazetteerIndex(loadGazetteerCounties(input.gazetteerText));
  } catch (err) {
    issues.push(
      issue("error", "gazetteer", err instanceof Error ? err.message : "Gazetteer failed to load")
    );
    gazetteerIndex = new Map();
  }

  const areasByCode = new Map<string, OflcAreaRecord>();
  const localities: OflcAreaLocalityRecord[] = [];
  const localityKeys = new Set<string>();
  let fipsResolved = 0;
  let fipsGuVi = 0;
  let fipsUnmatched = 0;
  const unmatchedSamples: string[] = [];

  for (const row of geoFile.rows) {
    const area_code = row.Area ?? "";
    const area_name = row.AreaName ?? "";
    const state_ab = row.StateAb ?? "";
    const state_name = row.State ?? "";
    const county_town_name = row.CountyTownName ?? "";
    if (!AREA_CODE_RE.test(area_code)) {
      issues.push(issue("error", "malformed_area", `Area code is not 5–7 digit TEXT: ${area_code}`));
    }
    if (!area_name) {
      issues.push(issue("error", "area_name", `Area ${area_code} has an empty name`));
    }
    const existing = areasByCode.get(area_code);
    if (!existing) {
      areasByCode.set(area_code, { dataset_id: datasetId, area_code, area_name });
    } else if (existing.area_name !== area_name) {
      issues.push(
        issue(
          "error",
          "area_name_conflict",
          `Area ${area_code} has conflicting names: ${existing.area_name} vs ${area_name}`
        )
      );
    }

    const locKey = `${area_code}|${state_ab}|${county_town_name}`;
    if (localityKeys.has(locKey)) {
      issues.push(issue("error", "duplicate_locality", `Duplicate locality ${locKey}`));
      continue;
    }
    localityKeys.add(locKey);
    if (!state_ab || !county_town_name) {
      issues.push(issue("error", "locality_required", `Locality missing state or name for area ${area_code}`));
    }
    const fips = resolveCountyFips(state_ab, county_town_name, gazetteerIndex);
    if (fips.unmatched) {
      fipsUnmatched += 1;
      if (unmatchedSamples.length < 20) {
        unmatchedSamples.push(`${state_ab}|${county_town_name}|${area_code}`);
      }
      issues.push(
        issue(
          "error",
          "unmatched_locality_fips",
          `No deterministic FIPS for ${state_ab} ${county_town_name}`
        )
      );
    } else if (fips.county_fips) {
      fipsResolved += 1;
    } else {
      fipsGuVi += 1;
    }
    localities.push({
      dataset_id: datasetId,
      area_code,
      state_ab,
      state_name,
      county_town_name,
      county_fips: fips.county_fips,
    });
  }

  const areas = [...areasByCode.values()];
  const wageRecords: OflcWageRecord[] = [];
  const wageKeys = new Set<string>();
  const wageRaws = new Map<string, [string | null, string | null, string | null, string | null]>();
  const labelDistribution: Record<string, number> = {
    blank: 0,
    annual_wage: 0,
    high_wage: 0,
    no_leveled_wage: 0,
    other: 0,
  };
  const otherLabelSet = new Set<string>();

  for (const [index, row] of alcFile.rows.entries()) {
    const area_code = row.Area ?? "";
    const soc_code = row.SocCode ?? "";
    const context = `ALC row ${index + 2} ${area_code}/${soc_code}`;
    if (!AREA_CODE_RE.test(area_code)) {
      issues.push(issue("error", "malformed_area", `${context}: malformed area_code`));
    }
    if (!SOC_CODE_RE.test(soc_code)) {
      issues.push(issue("error", "malformed_soc", `${context}: malformed soc_code`));
    }
    const geo_level = Number(row.GeoLvl);
    if (!Number.isInteger(geo_level) || geo_level < 1 || geo_level > 4) {
      issues.push(issue("error", "invalid_geo_level", `${context}: geo_level ${row.GeoLvl}`));
    }
    const key = `${area_code}|${soc_code}`;
    if (wageKeys.has(key)) {
      issues.push(
        issue("error", "duplicate_wage_key", `Duplicate wage key (dataset, All Industries, ${area_code}, ${soc_code})`)
      );
      continue;
    }
    wageKeys.add(key);

    const l1 = parseOfficialDecimal(row.Level1 ?? "", `${context} Level1`, issues);
    const l2 = parseOfficialDecimal(row.Level2 ?? "", `${context} Level2`, issues);
    const l3 = parseOfficialDecimal(row.Level3 ?? "", `${context} Level3`, issues);
    const l4 = parseOfficialDecimal(row.Level4 ?? "", `${context} Level4`, issues);
    const avg = parseOfficialDecimal(row.Average ?? "", `${context} Average`, issues);
    const label = row.Label ? row.Label : null;
    const labelClass = classifyOfficialLabel(label);
    labelDistribution[labelClass] += 1;
    if (labelClass === "other" && label) otherLabelSet.add(label);

    wageRaws.set(key, [l1.raw, l2.raw, l3.raw, l4.raw]);
    wageRecords.push({
      dataset_id: datasetId,
      data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
      area_code,
      soc_code,
      geo_level: Number.isInteger(geo_level) ? geo_level : 0,
      level1: l1.value,
      level2: l2.value,
      level3: l3.value,
      level4: l4.value,
      average: avg.value,
      label,
    });
  }

  const occSet = new Set(occupations.map((o) => o.soc_code));
  const areaSet = new Set(areas.map((a) => a.area_code));
  const wageSocs = new Set(wageRecords.map((w) => w.soc_code));
  const wageAreas = new Set(wageRecords.map((w) => w.area_code));

  for (const soc of wageSocs) {
    if (!occSet.has(soc)) {
      issues.push(issue("error", "orphan_soc", `Wage records reference SOC ${soc} missing from occupations`));
    }
  }
  for (const soc of occSet) {
    if (!wageSocs.has(soc)) {
      issues.push(issue("error", "orphan_occupation", `Occupation ${soc} has no All Industries wage rows`));
    }
  }
  for (const area of wageAreas) {
    if (!areaSet.has(area)) {
      issues.push(issue("error", "orphan_area", `Wage records reference Area ${area} missing from Geography.csv`));
    }
  }
  for (const area of areaSet) {
    if (!wageAreas.has(area)) {
      issues.push(issue("error", "orphan_area_without_wages", `Area ${area} has no All Industries wage rows`));
    }
  }

  const fixtures: WageFixtureCheck[] =
    input.validateFixtures === false
      ? []
      : SOFTWARE_DEVELOPER_FIXTURES.map((fix) => {
    const key = `${fix.area_code}|${SOFTWARE_DEVELOPER_SOC}`;
    const actual = wageRaws.get(key) ?? null;
    const ok = !!actual && actual.every((v, i) => v === fix.expected[i]);
    if (!actual) {
      issues.push(
        issue("error", "fixture_missing", `${fix.name} SOC ${SOFTWARE_DEVELOPER_SOC} is missing from ALC_Export.csv`)
      );
    } else if (!ok) {
      issues.push(
        issue(
          "error",
          "fixture_mismatch",
          `${fix.name} official levels ${actual.join("/")} do not match expected ${fix.expected.join("/")}`
        )
      );
    }
    return {
      name: fix.name,
      soc_code: SOFTWARE_DEVELOPER_SOC,
      area_code: fix.area_code,
      expected: fix.expected,
      actual,
      ok,
    };
      });

  const otherLabels = [...otherLabelSet].sort();
  if (otherLabels.length > 0) {
    issues.push(
      issue(
        "warning",
        "unexpected_label",
        `Official package contains additional label value(s): ${otherLabels.join(", ")}`
      )
    );
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const dataset: WageDatasetRecord = {
    id: datasetId,
    wage_year: EXPECTED_OFLC_2026_27.wageYear,
    effective_start: EXPECTED_OFLC_2026_27.effectiveStart,
    effective_end: EXPECTED_OFLC_2026_27.effectiveEnd,
    data_source: OFLC_ALL_INDUSTRIES_DATA_SOURCE,
    package_filename: input.packageFilename,
    package_sha256: packageSha256,
    source_url: null,
    bls_survey: EXPECTED_OFLC_2026_27.blsSurvey,
    soc_version: EXPECTED_OFLC_2026_27.socVersion,
    status: errorCount > 0 ? "failed" : "imported",
    imported_at: null,
    activated_at: null,
    activated_by_clerk_user_id: null,
    row_counts: {
      occupations: occupations.length,
      areas: areas.length,
      localities: localities.length,
      wage_records: wageRecords.length,
    },
    validation_report: {
      dry_run: true,
      database_write: false,
      error_count: errorCount,
      warning_count: issues.filter((i) => i.severity === "warning").length,
      label_distribution: labelDistribution,
      other_labels: otherLabels,
    },
    notes: "Offline dry-run parse of official OFLC All Industries only. No database write.",
  };

  return {
    ok: errorCount === 0,
    dataset,
    occupations,
    areas,
    localities,
    wageRecords,
    labelDistribution,
    otherLabels,
    fixtures,
    issues,
    fipsResolution: {
      resolved: fipsResolved,
      nullGuVi: fipsGuVi,
      unmatched: fipsUnmatched,
      unmatchedSamples,
    },
  };
}

export function assertSchemaShape(result: OflcImportResult): string[] {
  const errors: string[] = [];
  const d = result.dataset;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(d.id)) {
    errors.push("dataset.id is not a UUID-shaped placeholder");
  }
  if (d.data_source !== OFLC_ALL_INDUSTRIES_DATA_SOURCE) {
    errors.push("dataset.data_source must be All Industries");
  }
  if (d.activated_by_clerk_user_id !== null) {
    errors.push("activated_by must remain unused during dry-run");
  }
  for (const occ of result.occupations.slice(0, 1)) {
    if (typeof occ.soc_code !== "string") errors.push("soc_code must remain TEXT");
  }
  for (const area of result.areas.slice(0, 1)) {
    if (typeof area.area_code !== "string") errors.push("area_code must remain TEXT");
  }
  for (const wage of result.wageRecords) {
    if ("user_wage_level" in wage || "user_level" in wage) {
      errors.push("user wage-level field is not allowed");
    }
    if (wage.data_source !== OFLC_ALL_INDUSTRIES_DATA_SOURCE) {
      errors.push("wage data_source must be All Industries");
    }
  }
  return errors;
}

