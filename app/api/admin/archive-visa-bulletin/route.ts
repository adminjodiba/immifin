export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  archiveVisaBulletinMonth,
  parseArchiveMonth,
  type ArchiveVisaBulletinResult,
} from "@/lib/visaBulletinArchive";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseArchiveMonth(searchParams.get("month"));

  if (!month) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or missing month. Use ?month=YYYY-MM.",
      },
      { status: 400 },
    );
  }

  try {
    const result: ArchiveVisaBulletinResult = await archiveVisaBulletinMonth(month);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to archive visa bulletin data";

    console.error("[visa-bulletin-archive] error:", message);

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}
