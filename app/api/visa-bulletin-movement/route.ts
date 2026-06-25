export const runtime = "nodejs";
export const revalidate = 86400;

import { NextResponse } from "next/server";
import {
  getVisaBulletinMovement,
  type MovementComparisonType,
} from "@/lib/visaBulletinMovement";

function parseComparisonType(value: string | null): MovementComparisonType | null {
  if (value === "final-action" || value === "filing") {
    return value;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = parseComparisonType(searchParams.get("type"));

  if (!type) {
    return NextResponse.json(
      { error: "Invalid or missing type. Use ?type=final-action or ?type=filing." },
      { status: 400 },
    );
  }

  try {
    const movements = await getVisaBulletinMovement(type);
    return NextResponse.json(movements);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to compute visa bulletin movement";

    console.error("[visa-bulletin-movement] error:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
