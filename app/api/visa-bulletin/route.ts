export const runtime = "nodejs";
export const revalidate = 86400;

import { NextResponse } from "next/server";
import {
  getVisaBulletinData,
  type VisaBulletinDataType,
} from "@/lib/visaBulletinData";

function parseDataType(value: string | null): VisaBulletinDataType | null {
  if (value === "final-action" || value === "filing") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  let type: VisaBulletinDataType = "final-action";

  if (typeParam !== null) {
    const parsed = parseDataType(typeParam);

    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid type. Use ?type=final-action or ?type=filing." },
        { status: 400 },
      );
    }

    type = parsed;
  }

  try {
    const data = await getVisaBulletinData(type);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load visa bulletin data";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
