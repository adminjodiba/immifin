import { NextResponse } from "next/server";
import {
  getVisaBulletinHistory,
  type VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";

export const runtime = "nodejs";
export const revalidate = 86400;

type DebugHistoryResponse = {
  totalRows: number;
  firstTenRows: VisaBulletinHistoryRecord[];
  uniqueCategories: string[];
  uniqueCountries: string[];
  uniqueTypes: string[];
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  try {
    const records = await getVisaBulletinHistory({});

    const response: DebugHistoryResponse = {
      totalRows: records.length,
      firstTenRows: records.slice(0, 10),
      uniqueCategories: uniqueSorted(records.map((row) => row.category)),
      uniqueCountries: uniqueSorted(records.map((row) => row.country)),
      uniqueTypes: uniqueSorted(records.map((row) => row.type)),
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load visa bulletin history debug data";

    console.error("[debug-history] error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
