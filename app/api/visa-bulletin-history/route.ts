import { NextResponse } from "next/server";
import {
  getVisaBulletinHistory,
  parseHistoryType,
  type VisaBulletinHistoryQuery,
} from "@/lib/visaBulletinHistory";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsedType = parseHistoryType(searchParams.get("type"));

  if (parsedType === null) {
    return NextResponse.json(
      {
        error:
          "Invalid type. Use FinalAction, Filing, final-action, or dates-for-filing.",
      },
      { status: 400 },
    );
  }

  const query: VisaBulletinHistoryQuery = {
    category: searchParams.get("category")?.trim() || undefined,
    country: searchParams.get("country")?.trim() || undefined,
    type: parsedType,
  };

  try {
    const records = await getVisaBulletinHistory(query);
    return NextResponse.json(records);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load visa bulletin history";

    console.error("[visa-bulletin-history] error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
