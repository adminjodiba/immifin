import { requireCapability } from "@/lib/subscription/requireCapability";
import { handleVisaBulletinMovementRequest } from "@/lib/visaBulletin/handleVisaBulletinMovementRequest";
import { getVisaBulletinMovement } from "@/lib/visaBulletinMovement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleVisaBulletinMovementRequest(request, {
    requireCapability,
    getVisaBulletinMovement,
  });
}
