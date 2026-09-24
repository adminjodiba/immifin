const EXPECTED_COLUMNS = [
  "zip",
  "geoid",
  "city",
  "state",
  "res_ratio",
  "bus_ratio",
  "oth_ratio",
  "tot_ratio",
] as const;

export type HudSheetRow = {
  zip: string;
  geoid: string;
  city: string;
  state: string;
  res_ratio: string;
  bus_ratio: string;
  oth_ratio: string;
  tot_ratio: string;
};

function cellText(cellXml: string): string {
  const t = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
  if (t) return t[1];
  const v = cellXml.match(/<v>([\s\S]*?)<\/v>/);
  return v ? v[1] : "";
}

export function parseHudWorksheetXml(xml: string): {
  sheetNameHint: string | null;
  dimension: string | null;
  header: string[];
  rows: HudSheetRow[];
} {
  const dimension = (xml.match(/dimension ref="([^"]+)"/) || [])[1] ?? null;
  const rows: HudSheetRow[] = [];
  const rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
  let header: string[] | null = null;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(xml))) {
    const byCol: Record<string, string> = {};
    const cellRe = /<c r="([A-Z]+)\d+"[^>]*>([\s\S]*?)<\/c>/g;
    let cell: RegExpExecArray | null;
    while ((cell = cellRe.exec(match[1]))) {
      byCol[cell[1]] = cellText(cell[2]);
    }
    const ordered = ["A", "B", "C", "D", "E", "F", "G", "H"].map((col) => byCol[col] ?? "");
    if (!header) {
      header = ordered.map((h) => h.trim().toLowerCase());
      continue;
    }
    rows.push({
      zip: ordered[0],
      geoid: ordered[1],
      city: ordered[2],
      state: ordered[3],
      res_ratio: ordered[4],
      bus_ratio: ordered[5],
      oth_ratio: ordered[6],
      tot_ratio: ordered[7],
    });
  }
  return {
    sheetNameHint: "Sheet1",
    dimension,
    header: header ?? [],
    rows,
  };
}

export function headerMatchesOfficial(header: string[]): boolean {
  return EXPECTED_COLUMNS.every((name, i) => header[i] === name);
}
