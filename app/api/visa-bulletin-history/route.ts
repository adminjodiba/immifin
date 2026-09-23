import { requireCapability } from "@/lib/subscription/requireCapability";
import { handleVisaBulletinHistoryRequest } from "@/lib/visaBulletin/handleVisaBulletinHistoryRequest";
import { getVisaBulletinHistory } from "@/lib/visaBulletinHistory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleVisaBulletinHistoryRequest(request, {
    requireCapability,
    getVisaBulletinHistory,
  });
}
