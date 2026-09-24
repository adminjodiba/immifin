/**
 * Read-only HUD ZIP → county → OFLC area resolution analysis.
 * Analysis only. Does not implement a product rule or write to a database.
 */
import { EXPECTED_PLACEHOLDER_GEOIDS } from "./constants";

export type Classification = "AUTO" | "CHOICE" | "UNMAPPED";

export type HudGeoRow = {
  zip: string;
  county_fips: string;
  bus_ratio: number | null;
  res_ratio: number | null;
  tot_ratio: number | null;
  pref_state: string | null;
};

export type OflcAreaRef = {
  area_code: string;
  area_name: string;
};

export type OflcLocalityRef = {
  area_code: string;
  area_name: string;
  county_fips: string | null;
  state_ab: string;
  county_town_name: string;
};

export type UnmappedReason =
  | "no_selected_hud_rows"
  | "official_placeholder_geoid"
  | "territory_outside_oflc_geography"
  | "missing_county_mapping"
  | "mixed_unmapped_reasons";

export type ZipScenarioResult = {
  classification: Classification;
  distinctAreas: OflcAreaRef[];
  selectedCounties: string[];
};

const PLACEHOLDER_FIPS = new Set<string>(EXPECTED_PLACEHOLDER_GEOIDS);
const TERRITORY_STATE = new Set(["AS", "GU", "MP", "PR", "VI"]);
const TERRITORY_FIPS_PREFIX = new Set(["60", "66", "69", "72", "78"]);

export function isPlaceholderFips(fips: string): boolean {
  return PLACEHOLDER_FIPS.has(fips) || /^000\d{2}$/.test(fips);
}

export function isTerritoryFips(fips: string, state: string | null): boolean {
  const prefix = fips.slice(0, 2);
  const st = (state ?? "").toUpperCase();
  return TERRITORY_FIPS_PREFIX.has(prefix) || TERRITORY_STATE.has(st);
}

export function classifyAreaCount(distinctAreaCount: number): Classification {
  if (distinctAreaCount <= 0) return "UNMAPPED";
  if (distinctAreaCount === 1) return "AUTO";
  return "CHOICE";
}

export function buildFipsAreaIndex(localities: readonly OflcLocalityRef[]): Map<string, OflcAreaRef[]> {
  const index = new Map<string, OflcAreaRef[]>();
  for (const loc of localities) {
    if (!loc.county_fips) continue;
    const current = index.get(loc.county_fips) ?? [];
    if (!current.some((item) => item.area_code === loc.area_code)) {
      current.push({ area_code: loc.area_code, area_name: loc.area_name });
    }
    index.set(loc.county_fips, current);
  }
  return index;
}

export function distinctAreasForCounties(
  counties: readonly string[],
  index: Map<string, OflcAreaRef[]>
): OflcAreaRef[] {
  const byCode = new Map<string, OflcAreaRef>();
  for (const fips of counties) {
    for (const area of index.get(fips) ?? []) {
      byCode.set(area.area_code, area);
    }
  }
  return [...byCode.values()].sort((a, b) => a.area_code.localeCompare(b.area_code));
}

export function selectScenarioA(rows: readonly HudGeoRow[]): HudGeoRow[] {
  return [...rows];
}

export function selectScenarioB(rows: readonly HudGeoRow[]): HudGeoRow[] {
  return rows.filter((row) => (row.bus_ratio ?? 0) > 0);
}

export function selectScenarioC(rows: readonly HudGeoRow[]): HudGeoRow[] {
  const positive = selectScenarioB(rows);
  return positive.length > 0 ? positive : selectScenarioA(rows);
}

export function selectScenarioD(rows: readonly HudGeoRow[]): HudGeoRow[] {
  if (rows.length === 0) return [];
  let max = Number.NEGATIVE_INFINITY;
  let sawNumeric = false;
  for (const row of rows) {
    if (row.bus_ratio === null) continue;
    sawNumeric = true;
    if (row.bus_ratio > max) max = row.bus_ratio;
  }
  if (!sawNumeric) return [...rows];
  return rows.filter((row) => row.bus_ratio === max);
}

export function resolveScenario(
  rows: readonly HudGeoRow[],
  selected: readonly HudGeoRow[],
  index: Map<string, OflcAreaRef[]>
): ZipScenarioResult {
  void rows;
  const selectedCounties = selected.map((row) => row.county_fips);
  const distinctAreas = distinctAreasForCounties(selectedCounties, index);
  return {
    classification: classifyAreaCount(distinctAreas.length),
    distinctAreas,
    selectedCounties,
  };
}

export function unmappedReason(
  selected: readonly HudGeoRow[],
  index: Map<string, OflcAreaRef[]>
): UnmappedReason | null {
  const areas = distinctAreasForCounties(
    selected.map((row) => row.county_fips),
    index
  );
  if (areas.length > 0) return null;
  if (selected.length === 0) return "no_selected_hud_rows";
  const reasons = new Set<UnmappedReason>();
  for (const row of selected) {
    if (index.has(row.county_fips)) continue;
    if (isPlaceholderFips(row.county_fips)) reasons.add("official_placeholder_geoid");
    else if (isTerritoryFips(row.county_fips, row.pref_state)) reasons.add("territory_outside_oflc_geography");
    else reasons.add("missing_county_mapping");
  }
  if (reasons.size === 0) return "missing_county_mapping";
  if (reasons.size === 1) return [...reasons][0] ?? "missing_county_mapping";
  return "mixed_unmapped_reasons";
}

export function groupRowsByZip(rows: readonly HudGeoRow[]): Map<string, HudGeoRow[]> {
  const groups = new Map<string, HudGeoRow[]>();
  for (const row of rows) {
    const list = groups.get(row.zip) ?? [];
    list.push(row);
    groups.set(row.zip, list);
  }
  return groups;
}

export function primaryCounty(
  rows: readonly HudGeoRow[],
  ratio: "bus_ratio" | "res_ratio"
): HudGeoRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, row) => ((best[ratio] ?? -1) >= (row[ratio] ?? -1) ? best : row));
}

export type ScenarioName = "A" | "B" | "C" | "D";

export type ScenarioTotals = {
  uniqueZips: number;
  auto: number;
  choice: number;
  unmapped: number;
  autoPct: number;
  choicePct: number;
  unmappedPct: number;
  areas1: number;
  areas2: number;
  areas3Plus: number;
  maxDistinctAreas: number;
};

export type NationalGeoReport = {
  uniqueZips: number;
  scenarios: Record<ScenarioName, ScenarioTotals>;
  zipsWithAnyZeroBus: number;
  zipsWithAllZeroBus: number;
  zipsWithNullBus: number;
  nullBusRows: number;
  zipsAreaSetChangesWithoutZeroBus: number;
  transitions: Record<string, number>;
  singleCountySingleArea: number;
  multiCountySingleArea: number;
  multiCountyMultiArea: number;
  singleCountyMultiArea: number;
  singleCountyUnmapped: number;
  multiCountyUnmapped: number;
  maxDistinctAreas: number;
  fipsWithMultipleAreas: number;
  busEqualsOneRows: number;
  busEqualsOneZips: number;
  busEqualsZeroRows: number;
  mixedPositiveBusZips: number;
  tiedHighestBusZips: number;
  zipsTotRatioNotOne: number;
  scenarioDExcludesOfficialCounty: number;
  scenarioDExcludesDifferentArea: number;
  busResPrimaryZips: number;
  busResSameArea: number;
  busResDifferentArea: number;
  busResMultiAreaRegardless: number;
  unmappedReasonsA: Record<UnmappedReason, number>;
  unmappedSamplesA: Array<{ zip: string; reason: UnmappedReason; fips: string[] }>;
};

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function emptyTotals(uniqueZips: number): ScenarioTotals {
  return {
    uniqueZips,
    auto: 0,
    choice: 0,
    unmapped: 0,
    autoPct: 0,
    choicePct: 0,
    unmappedPct: 0,
    areas1: 0,
    areas2: 0,
    areas3Plus: 0,
    maxDistinctAreas: 0,
  };
}

function areaKeySet(areas: readonly OflcAreaRef[]): string {
  return areas
    .map((area) => area.area_code)
    .sort()
    .join("|");
}

function bumpClassification(totals: ScenarioTotals, result: ZipScenarioResult): void {
  const n = result.distinctAreas.length;
  if (result.classification === "AUTO") totals.auto += 1;
  else if (result.classification === "CHOICE") totals.choice += 1;
  else totals.unmapped += 1;
  if (n === 1) totals.areas1 += 1;
  else if (n === 2) totals.areas2 += 1;
  else if (n >= 3) totals.areas3Plus += 1;
  if (n > totals.maxDistinctAreas) totals.maxDistinctAreas = n;
}

function finishTotals(totals: ScenarioTotals): void {
  totals.autoPct = pct(totals.auto, totals.uniqueZips);
  totals.choicePct = pct(totals.choice, totals.uniqueZips);
  totals.unmappedPct = pct(totals.unmapped, totals.uniqueZips);
}

export function analyzeNational(
  rows: readonly HudGeoRow[],
  index: Map<string, OflcAreaRef[]>
): NationalGeoReport {
  const groups = groupRowsByZip(rows);
  const uniqueZips = groups.size;
  const scenarios: Record<ScenarioName, ScenarioTotals> = {
    A: emptyTotals(uniqueZips),
    B: emptyTotals(uniqueZips),
    C: emptyTotals(uniqueZips),
    D: emptyTotals(uniqueZips),
  };
  const unmappedReasonsA: Record<UnmappedReason, number> = {
    no_selected_hud_rows: 0,
    official_placeholder_geoid: 0,
    territory_outside_oflc_geography: 0,
    missing_county_mapping: 0,
    mixed_unmapped_reasons: 0,
  };
  const unmappedSamplesA: NationalGeoReport["unmappedSamplesA"] = [];
  const transitions: Record<string, number> = {};
  let zipsWithAnyZeroBus = 0;
  let zipsWithAllZeroBus = 0;
  let zipsWithNullBus = 0;
  let nullBusRows = 0;
  let zipsAreaSetChangesWithoutZeroBus = 0;
  let singleCountySingleArea = 0;
  let multiCountySingleArea = 0;
  let multiCountyMultiArea = 0;
  let singleCountyMultiArea = 0;
  let singleCountyUnmapped = 0;
  let multiCountyUnmapped = 0;
  let maxDistinctAreas = 0;
  let busEqualsOneRows = 0;
  let busEqualsOneZips = 0;
  let busEqualsZeroRows = 0;
  let mixedPositiveBusZips = 0;
  let tiedHighestBusZips = 0;
  let zipsTotRatioNotOne = 0;
  let scenarioDExcludesOfficialCounty = 0;
  let scenarioDExcludesDifferentArea = 0;
  let busResPrimaryZips = 0;
  let busResSameArea = 0;
  let busResDifferentArea = 0;
  let busResMultiAreaRegardless = 0;
  let fipsWithMultipleAreas = 0;
  for (const areas of index.values()) {
    if (areas.length > 1) fipsWithMultipleAreas += 1;
  }

  for (const zipRows of groups.values()) {
    const a = resolveScenario(zipRows, selectScenarioA(zipRows), index);
    const b = resolveScenario(zipRows, selectScenarioB(zipRows), index);
    const c = resolveScenario(zipRows, selectScenarioC(zipRows), index);
    const d = resolveScenario(zipRows, selectScenarioD(zipRows), index);
    bumpClassification(scenarios.A, a);
    bumpClassification(scenarios.B, b);
    bumpClassification(scenarios.C, c);
    bumpClassification(scenarios.D, d);
    if (a.distinctAreas.length > maxDistinctAreas) maxDistinctAreas = a.distinctAreas.length;

    const zeroRows = zipRows.filter((row) => row.bus_ratio === 0);
    const nullRows = zipRows.filter((row) => row.bus_ratio === null);
    const positive = zipRows.filter((row) => (row.bus_ratio ?? 0) > 0);
    busEqualsZeroRows += zeroRows.length;
    nullBusRows += nullRows.length;
    if (zeroRows.length > 0) zipsWithAnyZeroBus += 1;
    if (zeroRows.length === zipRows.length) zipsWithAllZeroBus += 1;
    if (nullRows.length > 0) zipsWithNullBus += 1;
    if (zipRows.some((row) => row.bus_ratio === 1)) {
      busEqualsOneZips += 1;
      busEqualsOneRows += zipRows.filter((row) => row.bus_ratio === 1).length;
    }
    if (positive.length >= 2) {
      const uniquePos = new Set(positive.map((row) => row.bus_ratio));
      if (uniquePos.size >= 2) mixedPositiveBusZips += 1;
    }
    const selectedD = selectScenarioD(zipRows);
    if (selectedD.length > 1 && selectedD.every((row) => row.bus_ratio === selectedD[0]?.bus_ratio)) {
      if (zipRows.length > 1) tiedHighestBusZips += 1;
    }
    const totSum = zipRows.reduce((sum, row) => sum + (row.tot_ratio ?? 0), 0);
    if (Math.abs(totSum - 1) > 1e-6) zipsTotRatioNotOne += 1;

    if (areaKeySet(a.distinctAreas) !== areaKeySet(b.distinctAreas)) {
      zipsAreaSetChangesWithoutZeroBus += 1;
    }
    const transition = `${a.classification}->${b.classification}`;
    if (a.classification !== b.classification) {
      transitions[transition] = (transitions[transition] ?? 0) + 1;
    }

    if (zipRows.length === 1 && a.classification === "AUTO") singleCountySingleArea += 1;
    else if (zipRows.length > 1 && a.classification === "AUTO") multiCountySingleArea += 1;
    else if (zipRows.length > 1 && a.classification === "CHOICE") multiCountyMultiArea += 1;
    else if (zipRows.length === 1 && a.classification === "CHOICE") singleCountyMultiArea += 1;
    else if (zipRows.length === 1 && a.classification === "UNMAPPED") singleCountyUnmapped += 1;
    else if (zipRows.length > 1 && a.classification === "UNMAPPED") multiCountyUnmapped += 1;

    if (selectedD.length < zipRows.length) {
      scenarioDExcludesOfficialCounty += 1;
      const excluded = zipRows.filter((row) => !selectedD.includes(row));
      const keptAreas = new Set(d.distinctAreas.map((area) => area.area_code));
      const excludedAreas = distinctAreasForCounties(
        excluded.map((row) => row.county_fips),
        index
      );
      if (excludedAreas.some((area) => !keptAreas.has(area.area_code))) {
        scenarioDExcludesDifferentArea += 1;
      }
    }

    if (zipRows.length >= 2) {
      const busPrimary = primaryCounty(zipRows, "bus_ratio");
      const resPrimary = primaryCounty(zipRows, "res_ratio");
      if (busPrimary && resPrimary && busPrimary.county_fips !== resPrimary.county_fips) {
        busResPrimaryZips += 1;
        const busAreas = distinctAreasForCounties([busPrimary.county_fips], index);
        const resAreas = distinctAreasForCounties([resPrimary.county_fips], index);
        if (a.classification === "CHOICE") busResMultiAreaRegardless += 1;
        if (areaKeySet(busAreas) === areaKeySet(resAreas) && busAreas.length === 1) busResSameArea += 1;
        else if (areaKeySet(busAreas) !== areaKeySet(resAreas)) busResDifferentArea += 1;
      }
    }

    if (a.classification === "UNMAPPED") {
      const reason = unmappedReason(selectScenarioA(zipRows), index) ?? "missing_county_mapping";
      unmappedReasonsA[reason] += 1;
      if (unmappedSamplesA.length < 8) {
        unmappedSamplesA.push({
          zip: zipRows[0]?.zip ?? "",
          reason,
          fips: zipRows.map((row) => row.county_fips),
        });
      }
    }
  }

  finishTotals(scenarios.A);
  finishTotals(scenarios.B);
  finishTotals(scenarios.C);
  finishTotals(scenarios.D);

  return {
    uniqueZips,
    scenarios,
    zipsWithAnyZeroBus,
    zipsWithAllZeroBus,
    zipsWithNullBus,
    nullBusRows,
    zipsAreaSetChangesWithoutZeroBus,
    transitions,
    singleCountySingleArea,
    multiCountySingleArea,
    multiCountyMultiArea,
    singleCountyMultiArea,
    singleCountyUnmapped,
    multiCountyUnmapped,
    maxDistinctAreas,
    fipsWithMultipleAreas,
    busEqualsOneRows,
    busEqualsOneZips,
    busEqualsZeroRows,
    mixedPositiveBusZips,
    tiedHighestBusZips,
    zipsTotRatioNotOne,
    scenarioDExcludesOfficialCounty,
    scenarioDExcludesDifferentArea,
    busResPrimaryZips,
    busResSameArea,
    busResDifferentArea,
    busResMultiAreaRegardless,
    unmappedReasonsA,
    unmappedSamplesA,
  };
}

export function analyzeFixtureZip(
  rows: readonly HudGeoRow[],
  index: Map<string, OflcAreaRef[]>
): Record<ScenarioName, ZipScenarioResult> & { hudCountyCount: number; positiveBusCount: number } {
  return {
    hudCountyCount: rows.length,
    positiveBusCount: selectScenarioB(rows).length,
    A: resolveScenario(rows, selectScenarioA(rows), index),
    B: resolveScenario(rows, selectScenarioB(rows), index),
    C: resolveScenario(rows, selectScenarioC(rows), index),
    D: resolveScenario(rows, selectScenarioD(rows), index),
  };
}
