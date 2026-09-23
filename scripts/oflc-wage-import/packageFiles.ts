import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const DEFAULT_OFLC_PACKAGE =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/OFLC_Wages_2026-27.zip";
export const DEFAULT_OFLC_EXTRACTED =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/extracted";
export const DEFAULT_CENSUS_GAZETTEER =
  "C:/Users/Admin/AppData/Local/Temp/immifin-geo-proof-2026/census-gaz/2026_Gaz_counties_national.txt";
export const DEFAULT_OFLC_NOTES =
  "C:/Users/Admin/AppData/Local/Temp/immifin-oflc-research-2026/notes-2026.txt";

export function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function findExtractedFile(dir: string, name: string): string | null {
  const direct = join(dir, name);
  if (existsSync(direct)) return direct;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = findExtractedFile(join(dir, entry.name), name);
    if (nested) return nested;
  }
  return null;
}

export function extractZip(zipPath: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const result = spawnSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`,
    ],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Failed to extract official OFLC zip");
  }
}

export function resolveExtractedDir(packagePath: string, packageSha256: string, extractedArg?: string): string {
  if (extractedArg) return extractedArg;
  const knownAlc = join(DEFAULT_OFLC_EXTRACTED, "ALC_Export.csv");
  if (existsSync(knownAlc)) return DEFAULT_OFLC_EXTRACTED;
  return join(tmpdir(), `immifin-oflc-import-${packageSha256.slice(0, 16)}`);
}

export function ensureExtractedPackage(
  packagePath: string,
  packageSha256: string,
  extractedArg?: string
): { extractedDir: string; occPath: string; geoPath: string; alcPath: string; edcPath: string | null } {
  const extractedDir = resolveExtractedDir(packagePath, packageSha256, extractedArg);
  if (!existsSync(join(extractedDir, "ALC_Export.csv"))) {
    if (!existsSync(extractedDir) || readdirSync(extractedDir).length === 0) {
      extractZip(packagePath, extractedDir);
    }
  }
  const occPath = findExtractedFile(extractedDir, "oes_soc_occs.csv");
  const geoPath = findExtractedFile(extractedDir, "Geography.csv");
  const alcPath = findExtractedFile(extractedDir, "ALC_Export.csv");
  if (!occPath || !geoPath || !alcPath) {
    throw new Error("Official package is missing ALC_Export.csv, Geography.csv, or oes_soc_occs.csv.");
  }
  return {
    extractedDir,
    occPath,
    geoPath,
    alcPath,
    edcPath: findExtractedFile(extractedDir, "EDC_Export.csv"),
  };
}

export function loadNotes(notesPath: string | undefined, extractedDir: string): string | null {
  if (notesPath && existsSync(notesPath)) {
    return readFileSync(notesPath, "utf8");
  }
  const pdf = findExtractedFile(extractedDir, "FINAL-OEWS-Technical-Release-Notes-for-July-2026-Wage-Year.pdf");
  if (pdf) {
    return readFileSync(pdf, "latin1");
  }
  return null;
}
