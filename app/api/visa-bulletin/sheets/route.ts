export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { loadAllVisaBulletinSheets } from "@/lib/visaBulletinSheets";

/** Backend verification endpoint — loads all four sheets and logs row counts. */
export async function GET() {
  try {
    const sheets = await loadAllVisaBulletinSheets();

    return NextResponse.json({
      counts: {
        FinalActionDates: sheets.FinalActionDates.length,
        DatesForFiling: sheets.DatesForFiling.length,
        PreviousFinalActionDates: sheets.PreviousFinalActionDates.length,
        PreviousDatesForFiling: sheets.PreviousDatesForFiling.length,
      },
      samples: {
        FinalActionDates: sheets.FinalActionDates.slice(0, 3),
        DatesForFiling: sheets.DatesForFiling.slice(0, 3),
        PreviousFinalActionDates: sheets.PreviousFinalActionDates.slice(0, 3),
        PreviousDatesForFiling: sheets.PreviousDatesForFiling.slice(0, 3),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load visa bulletin sheets";

    console.error("[visa-bulletin] sheet load error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
