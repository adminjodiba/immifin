/**
 * Read-only Dev analysis: HUD ZIP → county → official OFLC area.
 * Zero database mutations. Production is hard-blocked.
 *
 *   npx tsx scripts/hud-zip-import/analyzeGeoResolution.ts --target dev
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import {
  EXPECTED_OFFICIAL_COUNTS,
  H1B_ALL_TABLES,
  IMMIFIN_DEV_PROJECT_REF,
  IMMIFIN_PROD_PROJECT_REF,
} from "../oflc-wage-import/constants";
import { assertReadOnlySql } from "../oflc-wage-import/readOnlySql";
import { assertDevOnlyTarget, classifyProjectRef, maskProjectRef } from "../oflc-wage-import/targetGuard";
import { sanitizeCliWriteFailure } from "../oflc-wage-import/writeOflcDev";
import { EXPECTED_HUD_COUNTS, EXPECTED_OFLC_DEV_COUNTS } from "./constants";
import {
  analyzeFixtureZip,
  analyzeNational,
  buildFipsAreaIndex,
  type HudGeoRow,
  type OflcLocalityRef,
} from "./geoResolution";
import { parseHudZipCountyWorkbook } from "./parseHudWorkbook";
import { EXPECTED_HUD_ZIP_COUNTY_Q2_2026 } from "./types";
import { DEFAULT_HUD_WORKBOOK, loadOfficialHudSheet, sha256File } from "./workbook";

function queryLinkedJson(sql: string): unknown {
  const safeSql = assertReadOnlySql(sql);
  const file = join(tmpdir(), `immifin-geo-analysis-readonly-${Date.now()}-${Math.random().toString(16).slice(2)}.sql`);
  writeFileSync(file, safeSql, "utf8");
  try {
    const result = spawnSync(
      "npx",
      ["--yes", "supabase", "db", "query", "--linked", "--file", file],
      { encoding: "utf8", shell: true }
    );
    if (result.status !== 0) {
      const sanitized = sanitizeCliWriteFailure(result.status, result.stdout ?? "", result.stderr ?? "");
      throw new Error(
        `Read-only query failed. category=${sanitized.category} postgresCode=${sanitized.postgresCode ?? "none"} httpStatus=${sanitized.httpStatus ?? "none"} exitStatus=${sanitized.exitStatus ?? "none"}`
      );
    }
    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    const start = combined.indexOf("{");
    const end = combined.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("Read-only query did not return JSON.");
    return JSON.parse(combined.slice(start, end + 1));
  } finally {
    try {
      unlinkSync(file);
    } catch {
      // ignore
    }
  }
}

function rowsOf<T>(payload: unknown): T[] {
  if (payload && typeof payload === "object" && "rows" in payload) {
    return ((payload as { rows?: T[] }).rows ?? []) as T[];
  }
  return [];
}

function parseProjectsJson(raw: string): Array<{ name: string; id: string; linked: boolean }> {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end < 0) return [];
  const parsed = JSON.parse(raw.slice(start, end + 1)) as Array<{ name?: string; id?: string; ref?: string; linked?: boolean }>;
  return parsed.map((row) => ({
    name: row.name ?? "",
    id: row.id ?? row.ref ?? "",
    linked: row.linked === true,
  }));
}

function main(): void {
  const explicitTarget = process.argv.includes("--target")
    ? process.argv[process.argv.indexOf("--target") + 1]
    : undefined;
  if (process.argv.includes("--write") || process.argv.includes("--resume")) {
    console.error("STOP: this analysis is read-only.");
    process.exit(2);
  }

  console.log("HUD/OFLC geography analysis — READ-ONLY. Zero mutations.");
  console.log(`Eligible target: Dev ${IMMIFIN_DEV_PROJECT_REF.mask}`);
  console.log(`Hard-blocked: Production ${IMMIFIN_PROD_PROJECT_REF.mask}`);

  const list = spawnSync("npx", ["--yes", "supabase", "projects", "list", "-o", "json"], {
    encoding: "utf8",
    shell: true,
  });
  if (list.status !== 0) {
    console.error("STOP: unable to list Supabase projects.");
    process.exit(2);
  }
  const projects = parseProjectsJson(`${list.stdout ?? ""}\n${list.stderr ?? ""}`);
  const linked = projects.find((p) => p.linked);
  const prod = projects.find((p) => classifyProjectRef(p.id) === "production");
  if (!linked) {
    console.error("STOP: repository is not CLI-linked.");
    process.exit(2);
  }
  console.log(`CLI linked: ${linked.name} ${maskProjectRef(linked.id)}`);
  if (prod) console.log(`Production present (not linked): ${prod.name} ${maskProjectRef(prod.id)}`);

  const guard = assertDevOnlyTarget({
    explicitTarget,
    projectRef: linked.id,
    write: false,
  });
  if (!guard.ok || classifyProjectRef(linked.id) !== "dev") {
    console.error("STOP: analysis requires Dev.");
    process.exit(2);
  }

  const countSql = `
select 'wage_datasets' as table_name, count(*)::bigint as n from public.wage_datasets
union all select 'oflc_occupations', count(*)::bigint from public.oflc_occupations
union all select 'oflc_areas', count(*)::bigint from public.oflc_areas
union all select 'oflc_area_localities', count(*)::bigint from public.oflc_area_localities
union all select 'oflc_wage_records', count(*)::bigint from public.oflc_wage_records
union all select 'county_fips_names', count(*)::bigint from public.county_fips_names
union all select 'zip_crosswalk_versions', count(*)::bigint from public.zip_crosswalk_versions
union all select 'zip_county_crosswalk', count(*)::bigint from public.zip_county_crosswalk
order by 1;
`;
  const activeSql = `
select
  (select count(*) from public.wage_datasets where status = 'active')::bigint as active_wage_datasets,
  (select count(*) from public.zip_crosswalk_versions where status = 'active')::bigint as active_zip_crosswalks;
`;
  const statusSql = `
select 'oflc' as kind, status::text as status, count(*)::bigint as n from public.wage_datasets group by status
union all
select 'hud', status::text, count(*)::bigint from public.zip_crosswalk_versions group by status
order by 1, 2;
`;

  const counts: Record<string, number> = {};
  for (const row of rowsOf<{ table_name?: string; n?: number }>(queryLinkedJson(countSql))) {
    if (row.table_name) counts[row.table_name] = Number(row.n);
  }
  const active = rowsOf<{ active_wage_datasets?: number; active_zip_crosswalks?: number }>(queryLinkedJson(activeSql))[0];
  const statuses = rowsOf<{ kind?: string; status?: string; n?: number }>(queryLinkedJson(statusSql));
  console.log("Dev baseline");
  for (const table of H1B_ALL_TABLES) {
    console.log(`  ${table}: ${counts[table] ?? "missing"}`);
  }
  console.log(`  active_wage_datasets: ${active?.active_wage_datasets ?? 0}`);
  console.log(`  active_zip_crosswalks: ${active?.active_zip_crosswalks ?? 0}`);
  for (const row of statuses) {
    console.log(`  ${row.kind} status ${row.status}: ${row.n}`);
  }

  const baselineOk =
    (counts.wage_datasets ?? -1) === EXPECTED_OFLC_DEV_COUNTS.wage_datasets &&
    (counts.oflc_occupations ?? -1) === EXPECTED_OFFICIAL_COUNTS.occupations &&
    (counts.oflc_areas ?? -1) === EXPECTED_OFFICIAL_COUNTS.areas &&
    (counts.oflc_area_localities ?? -1) === EXPECTED_OFFICIAL_COUNTS.localities &&
    (counts.oflc_wage_records ?? -1) === EXPECTED_OFFICIAL_COUNTS.wage_records &&
    (counts.zip_crosswalk_versions ?? -1) === 1 &&
    (counts.zip_county_crosswalk ?? -1) === EXPECTED_HUD_COUNTS.rows &&
    (counts.county_fips_names ?? -1) === 0 &&
    Number(active?.active_wage_datasets ?? -1) === 0 &&
    Number(active?.active_zip_crosswalks ?? -1) === 0;
  if (!baselineOk) {
    console.error("GEO DATA ISSUE REQUIRES REVIEW — Dev baseline does not match the verified imported/non-active state.");
    process.exit(2);
  }

  const workbookPath = DEFAULT_HUD_WORKBOOK;
  if (!existsSync(workbookPath)) {
    console.error("STOP: official HUD workbook is not available locally.");
    process.exit(2);
  }
  const packageSha256 = sha256File(workbookPath).toLowerCase();
  if (packageSha256 !== EXPECTED_HUD_ZIP_COUNTY_Q2_2026.sha256) {
    console.error("STOP: official HUD workbook SHA-256 mismatch.");
    process.exit(2);
  }
  const sheet = loadOfficialHudSheet(workbookPath, packageSha256);
  const parsed = parseHudZipCountyWorkbook({
    filename: basename(workbookPath),
    packageSha256,
    header: sheet.header,
    rows: sheet.rows,
    gazetteerText: null,
    geographyCsv: null,
    gazetteerVintage: null,
  });
  if (!parsed.ok || parsed.counts.rows !== EXPECTED_HUD_COUNTS.rows) {
    console.error("STOP: official HUD parse failed or count mismatch.");
    process.exit(2);
  }

  console.log("Fetching official OFLC geography from Dev (read-only).");
  const areaRows = rowsOf<{ area_code?: string; area_name?: string }>(
    queryLinkedJson(`select area_code, area_name from public.oflc_areas order by area_code;`)
  );
  const areaNames = new Map(areaRows.map((row) => [row.area_code ?? "", row.area_name ?? ""]));
  const localityRows = rowsOf<{
    area_code?: string;
    county_fips?: string | null;
    state_ab?: string;
    county_town_name?: string;
  }>(
    queryLinkedJson(`
select area_code, county_fips, state_ab, county_town_name
from public.oflc_area_localities
order by area_code, county_fips;
`)
  );
  if (areaRows.length !== 530 || localityRows.length !== 3275) {
    console.error("GEO DATA ISSUE REQUIRES REVIEW — OFLC geography counts changed.");
    process.exit(2);
  }
  const localities: OflcLocalityRef[] = localityRows.map((row) => ({
    area_code: row.area_code ?? "",
    area_name: areaNames.get(row.area_code ?? "") ?? "",
    county_fips: row.county_fips ?? null,
    state_ab: row.state_ab ?? "",
    county_town_name: row.county_town_name ?? "",
  }));
  const index = buildFipsAreaIndex(localities);

  const geoLevelRows = rowsOf<{ geo_level?: number; n?: number; areas?: number }>(
    queryLinkedJson(`
select geo_level, count(*)::bigint as n, count(distinct area_code)::bigint as areas
from public.oflc_wage_records
group by geo_level
order by 1;
`)
  );
  const multiGeoAreas = rowsOf<{ n?: number }>(
    queryLinkedJson(`
select count(*)::bigint as n
from (
  select area_code
  from public.oflc_wage_records
  group by area_code
  having count(distinct geo_level) > 1
) s;
`)
  )[0];

  const hudRows: HudGeoRow[] = parsed.rows.map((row) => ({
    zip: row.zip,
    county_fips: row.county_fips,
    bus_ratio: row.bus_ratio,
    res_ratio: row.res_ratio,
    tot_ratio: row.tot_ratio,
    pref_state: row.pref_state,
  }));
  const report = analyzeNational(hudRows, index);
  const byZip = new Map<string, HudGeoRow[]>();
  for (const row of hudRows) {
    const list = byZip.get(row.zip) ?? [];
    list.push(row);
    byZip.set(row.zip, list);
  }

  const fixtureDev = rowsOf<{
    zip?: string;
    county_fips?: string;
    bus_ratio?: unknown;
    res_ratio?: unknown;
    tot_ratio?: unknown;
  }>(
    queryLinkedJson(`
select zip, county_fips, bus_ratio, res_ratio, tot_ratio
from public.zip_county_crosswalk
where zip in ('76945', '77433', '77031', '00501')
order by zip, county_fips;
`)
  );
  console.log(`Dev fixture rows confirmed: ${fixtureDev.length}`);

  const fixtures = ["76945", "77433", "77031", "00501"].map((zip) => {
    const rows = byZip.get(zip) ?? [];
    const analyzed = analyzeFixtureZip(rows, index);
    return {
      zip,
      rows: rows.map((row) => ({
        county_fips: row.county_fips,
        bus_ratio: row.bus_ratio,
        res_ratio: row.res_ratio,
        tot_ratio: row.tot_ratio,
        areas: (index.get(row.county_fips) ?? []).map((area) => ({
          area_code: area.area_code,
          area_name: area.area_name,
        })),
      })),
      ...analyzed,
    };
  });

  const output = {
    baseline: {
      oflc: EXPECTED_OFLC_DEV_COUNTS,
      hud_rows: EXPECTED_HUD_COUNTS.rows,
      unique_zips: EXPECTED_HUD_COUNTS.uniqueZips,
      county_fips_names: 0,
      hud_active: 0,
      oflc_active: 0,
    },
    report,
    fixtures,
    geoLevel: {
      byLevel: geoLevelRows.map((row) => ({
        geo_level: Number(row.geo_level),
        wage_records: Number(row.n),
        distinct_areas: Number(row.areas),
      })),
      areasWithMultipleGeoLevels: Number(multiGeoAreas?.n ?? 0),
    },
    fipsCoverage: {
      hudUniqueFips: parsed.counts.uniqueCountyFips,
      oflcIndexedFips: index.size,
    },
  };

  console.log(JSON.stringify(output, null, 2));
  console.log("GEO RESOLUTION ANALYSIS COMPLETE — WAITING FOR PRODUCT OWNER DECISION");
}

main();
