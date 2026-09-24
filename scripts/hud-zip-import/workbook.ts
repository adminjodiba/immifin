/**
 * Official HUD workbook open/extract. Never connects to a database.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseHudWorksheetXml, type HudSheetRow } from "./xlsx";

export const DEFAULT_HUD_WORKBOOK = "C:/Users/Admin/Downloads/ZIP-COUNTY_062026.xlsx";
export const DEFAULT_GAZETTEER =
  "C:/Users/Admin/AppData/Local/Temp/immifin-geo-proof-2026/census-gaz/2026_Gaz_counties_national.txt";
export const DEFAULT_GEOGRAPHY =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/extracted/Geography.csv";

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function extractXlsx(xlsxPath: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const zipCopy = join(dest, "workbook.zip");
  copyFileSync(xlsxPath, zipCopy);
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${join(dest, "extracted").replace(/'/g, "''")}' -Force`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error("Failed to extract official HUD xlsx.");
  }
}

export function loadOfficialHudSheet(workbookPath: string, packageSha256: string): {
  header: string[];
  rows: HudSheetRow[];
  dimension: string | null;
} {
  const extractRoot = join(tmpdir(), `immifin-hud-import-${packageSha256.slice(0, 16)}`);
  const extracted = join(extractRoot, "extracted");
  const sheetPath = join(extracted, "xl/worksheets/sheet1.xml");
  if (!existsSync(sheetPath)) {
    if (existsSync(extractRoot)) rmSync(extractRoot, { recursive: true, force: true });
    extractXlsx(workbookPath, extractRoot);
  }
  if (!existsSync(sheetPath)) {
    throw new Error("Official workbook is missing xl/worksheets/sheet1.xml");
  }
  const sheet = parseHudWorksheetXml(readFileSync(sheetPath, "utf8"));
  return { header: sheet.header, rows: sheet.rows, dimension: sheet.dimension };
}
