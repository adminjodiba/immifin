export function parseCsvLine(line: string, delim = ","): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function loadDelimited(text: string, delim = ","): {
  header: string[];
  rows: Record<string, string>[];
} {
  const raw = text.replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { header: [], rows: [] };
  }
  const header = parseCsvLine(lines[0], delim).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = parseCsvLine(line, delim);
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (vals[i] ?? "").trim();
    });
    return o;
  });
  return { header, rows };
}

export function requireColumns(
  header: string[],
  required: string[],
  fileLabel: string
): string | null {
  const missing = required.filter((c) => !header.includes(c));
  if (missing.length === 0) return null;
  return `${fileLabel} missing required columns: ${missing.join(", ")}`;
}
