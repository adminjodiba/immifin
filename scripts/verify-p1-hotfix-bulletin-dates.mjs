import { parseBulletinCutoffDate, formatBulletinDate } from "../lib/visaBulletinData.ts";
import { toCivilIsoDate } from "../lib/dates/civilDate.ts";

const cases = [
  ["01 Jul 2023", "2023-07-01", "Jul 1, 2023"],
  ["15 Oct 2022", "2022-10-15", "Oct 15, 2022"],
  ["01 Sep 2021", "2021-09-01", "Sep 1, 2021"],
  ["01 Jan 2022", "2022-01-01", "Jan 1, 2022"],
  ["01 Aug 2023", "2023-08-01", "Aug 1, 2023"],
  ["01 Sep 2024", "2024-09-01", "Sep 1, 2024"],
];

let ok = true;
for (const [input, expectedIso, expectedDisplay] of cases) {
  const iso = parseBulletinCutoffDate(input);
  const short =
    typeof iso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(iso)
      ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : String(iso);
  const pass = iso === expectedIso && short === expectedDisplay;
  console.log(`${pass ? "PASS" : "FAIL"} ${input} => ${iso} display=${short}`);
  if (!pass) ok = false;
}

console.log(`C=${parseBulletinCutoffDate("C")}`);
console.log(`U=${parseBulletinCutoffDate("U")}`);
console.log(`CURRENT=${parseBulletinCutoffDate("CURRENT")}`);
console.log(`UNAVAILABLE=${parseBulletinCutoffDate("UNAVAILABLE")}`);
console.log(`ISO=${parseBulletinCutoffDate("2023-07-01")}`);
console.log(`format=${formatBulletinDate("2023-07-01")}`);
console.log(`slash=${toCivilIsoDate("7/1/2023")}`);
console.log(`ALL_OK=${ok}`);
if (!ok) process.exit(1);
