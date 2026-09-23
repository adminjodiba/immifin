/**
 * Deterministic OFLC locality → Census county FIPS resolution (H1BWAGE-004).
 * Exact normalized legal name + state, then Unicode diacritic fold.
 * No fuzzy matching. GU/VI keep county_fips null.
 */

export function foldLocalityName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export type GazetteerCounty = {
  state_ab: string;
  county_fips: string;
  name: string;
};

export function loadGazetteerCounties(text: string): GazetteerCounty[] {
  const raw = text.replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const delim = lines[0].includes("|") ? "|" : ",";
  const header = lines[0].split(delim).map((h) => h.trim());
  const usps = header.indexOf("USPS");
  const geoid = header.indexOf("GEOID");
  const name = header.indexOf("NAME");
  if (usps < 0 || geoid < 0 || name < 0) {
    throw new Error("Census Gazetteer is missing USPS, GEOID, or NAME columns");
  }
  return lines.slice(1).map((line) => {
    const vals = line.split(delim);
    return {
      state_ab: (vals[usps] ?? "").trim(),
      county_fips: (vals[geoid] ?? "").trim().padStart(5, "0"),
      name: (vals[name] ?? "").trim(),
    };
  });
}

export function buildGazetteerIndex(
  counties: GazetteerCounty[]
): Map<string, GazetteerCounty> {
  const index = new Map<string, GazetteerCounty>();
  for (const county of counties) {
    index.set(`${county.state_ab}|${foldLocalityName(county.name)}`, county);
  }
  return index;
}

export function isGuViTerritory(stateAb: string): boolean {
  return stateAb === "GU" || stateAb === "VI";
}

export function resolveCountyFips(
  stateAb: string,
  countyTownName: string,
  gazetteer: Map<string, GazetteerCounty>
): { county_fips: string | null; unmatched: boolean } {
  if (isGuViTerritory(stateAb)) {
    return { county_fips: null, unmatched: false };
  }
  const hit = gazetteer.get(`${stateAb}|${foldLocalityName(countyTownName)}`);
  if (!hit) {
    return { county_fips: null, unmatched: true };
  }
  return { county_fips: hit.county_fips, unmatched: false };
}
