import { isAuthError } from "@/lib/auth/errors";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import {
  type MovementComparisonType,
  type VisaBulletinMovementRow,
} from "@/lib/visaBulletinMovement";
import {
  premiumVisaBulletinAuthError,
  premiumVisaBulletinJson,
  type RequireCapabilityFn,
} from "@/lib/visaBulletin/premiumBulletinApi";

function parseComparisonType(value: string | null): MovementComparisonType | null {
  if (value === "final-action" || value === "filing") {
    return value;
  }

  return null;
}

export type VisaBulletinMovementLoader = (
  type: MovementComparisonType,
) => Promise<VisaBulletinMovementRow[]>;

export type VisaBulletinMovementRequestDeps = {
  requireCapability: RequireCapabilityFn;
  getVisaBulletinMovement: VisaBulletinMovementLoader;
};

export async function handleVisaBulletinMovementRequest(
  request: Request,
  deps: VisaBulletinMovementRequestDeps,
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const type = parseComparisonType(searchParams.get("type"));

  if (!type) {
    return premiumVisaBulletinJson(
      { error: "Invalid or missing type. Use ?type=final-action or ?type=filing." },
      400,
    );
  }

  try {
    await deps.requireCapability(CAPABILITY.movementTracker);
    const movements = await deps.getVisaBulletinMovement(type);
    return premiumVisaBulletinJson(movements);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return premiumVisaBulletinAuthError(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to compute visa bulletin movement";
    console.error("[visa-bulletin-movement] error:", message);
    return premiumVisaBulletinJson({ error: message }, 500);
  }
}
