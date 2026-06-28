import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { updateImmigrationProfile } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = new Set([
  "EB1",
  "EB2",
  "EB3",
  "EB4",
  "EB5",
  "F1",
  "F2A",
  "F2B",
  "F3",
  "F4",
]);

const ALLOWED_COUNTRIES = new Set(["India", "China", "Mexico", "Philippines", "ROW"]);

const ALLOWED_BULLETIN_TYPES = new Set(["final_action", "dates_for_filing"]);

type PatchBody = {
  defaultCategory?: unknown;
  defaultCountry?: unknown;
  defaultBulletinType?: unknown;
};

function normalizeOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AuthError("Invalid request body.", 400);
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function validateCategory(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (!ALLOWED_CATEGORIES.has(value)) {
    throw new AuthError(
      "Invalid defaultCategory. Use EB1, EB2, EB3, EB4, EB5, F1, F2A, F2B, F3, F4, or empty.",
      400,
    );
  }

  return value;
}

function validateCountry(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (!ALLOWED_COUNTRIES.has(value)) {
    throw new AuthError(
      "Invalid defaultCountry. Use India, China, Mexico, Philippines, ROW, or empty.",
      400,
    );
  }

  return value;
}

function validateBulletinType(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (!ALLOWED_BULLETIN_TYPES.has(value)) {
    throw new AuthError(
      "Invalid defaultBulletinType. Use final_action, dates_for_filing, or empty.",
      400,
    );
  }

  return value;
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    const body = (await request.json()) as PatchBody;

    const immigrationProfile = await updateImmigrationProfile(profileWithRelations.profile.id, {
      default_category: validateCategory(normalizeOptionalString(body.defaultCategory)),
      default_country: validateCountry(normalizeOptionalString(body.defaultCountry)),
      default_bulletin_type: validateBulletinType(normalizeOptionalString(body.defaultBulletinType)),
    });

    return NextResponse.json({ immigrationProfile });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
