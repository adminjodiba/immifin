export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getVisaBulletinData } from "@/lib/visaBulletinData";

export async function GET() {
  try {
    const data = await getVisaBulletinData();

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }
}
