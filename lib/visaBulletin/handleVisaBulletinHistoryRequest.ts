import { isAuthError } from "@/lib/auth/errors";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import {
  parseHistoryType,
  type VisaBulletinHistoryQuery,
  type VisaBulletinHistoryRecord,
} from "@/lib/visaBulletinHistory";
import {
  premiumVisaBulletinAuthError,
  premiumVisaBulletinJson,
  type RequireCapabilityFn,
} from "@/lib/visaBulletin/premiumBulletinApi";

export type VisaBulletinHistoryLoader = (
  query: VisaBulletinHistoryQuery,
) => Promise<VisaBulletinHistoryRecord[]>;

export type VisaBulletinHistoryRequestDeps = {
  requireCapability: RequireCapabilityFn;
  getVisaBulletinHistory: VisaBulletinHistoryLoader;
};

export async function handleVisaBulletinHistoryRequest(
  request: Request,
  deps: VisaBulletinHistoryRequestDeps,
): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const parsedType = parseHistoryType(searchParams.get("type"));

  if (parsedType === null) {
    return premiumVisaBulletinJson(
      {
        error:
          "Invalid type. Use FinalAction, Filing, final-action, or dates-for-filing.",
      },
      400,
    );
  }

  const query: VisaBulletinHistoryQuery = {
    category: searchParams.get("category")?.trim() || undefined,
    country: searchParams.get("country")?.trim() || undefined,
    type: parsedType,
  };

  try {
    await deps.requireCapability(CAPABILITY.visaHistory);
    const records = await deps.getVisaBulletinHistory(query);
    return premiumVisaBulletinJson(records);
  } catch (error: unknown) {
    if (isAuthError(error)) {
      return premiumVisaBulletinAuthError(error);
    }

    const message =
      error instanceof Error ? error.message : "Failed to load visa bulletin history";
    console.error("[visa-bulletin-history] error:", message);
    return premiumVisaBulletinJson({ error: message }, 500);
  }
}
