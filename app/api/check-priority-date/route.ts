export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { checkPriorityDate } from "@/lib/visaBulletinData";

type CheckPriorityDateInput = {
  priorityDate?: string;
  category?: string;
  country?: string;
};

async function runCheck(input: CheckPriorityDateInput) {
  const { priorityDate, category, country } = input;

  if (!priorityDate || !category || !country) {
    return NextResponse.json(
      {
        error: "Missing required fields: priorityDate, category, country",
      },
      { status: 400 },
    );
  }

  try {
    const result = await checkPriorityDate(priorityDate, category, country);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return runCheck({
    priorityDate: searchParams.get("priorityDate") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    country: searchParams.get("country") ?? undefined,
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckPriorityDateInput;
  return runCheck(body);
}
