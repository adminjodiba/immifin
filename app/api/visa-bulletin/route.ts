export const runtime = "nodejs";
export const revalidate = 86400;

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
