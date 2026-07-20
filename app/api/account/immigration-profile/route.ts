import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { CAPABILITY } from "@/lib/subscription/capabilities";
import { assertCapability } from "@/lib/subscription/requireCapability";
import { updateImmigrationProfile } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = new Set(["EB1", "EB2", "EB3"]);

const ALLOWED_COUNTRIES = new Set(["India", "China", "Mexico", "Philippines", "ROW"]);

const ALLOWED_BULLETIN_TYPES = new Set(["final_action", "dates_for_filing"]);

type PatchBody = {
  defaultCategory?: unknown;
  defaultCountry?: unknown;
  defaultBulletinType?: unknown;
  greenCardIssueDate?: unknown;
  marriedToUsCitizen?: unknown;
  priorityDate?: unknown;
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
    throw new AuthError("Invalid defaultCategory. Use EB1, EB2, EB3, or empty.", 400);
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

function validateGreenCardIssueDate(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AuthError("Invalid greenCardIssueDate. Use YYYY-MM-DD or empty.", 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new AuthError("Invalid greenCardIssueDate. Use a valid YYYY-MM-DD date.", 400);
  }

  return value;
}

function validatePriorityDate(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new AuthError("Invalid priorityDate. Use YYYY-MM-DD or empty.", 400);
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new AuthError("Invalid priorityDate. Use a valid YYYY-MM-DD date.", 400);
  }

  return value;
}

function validateMarriedToUsCitizen(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value === true || value === false) {
    return value;
  }

  throw new AuthError("Invalid marriedToUsCitizen. Use true, false, or empty.", 400);
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    assertCapability(profileWithRelations, CAPABILITY.saveImmigrationProfile);
    const body = (await request.json()) as PatchBody;

    const immigrationProfile = await updateImmigrationProfile(profileWithRelations.profile.id, {
      default_category: validateCategory(normalizeOptionalString(body.defaultCategory)),
      default_country: validateCountry(normalizeOptionalString(body.defaultCountry)),
      default_bulletin_type: validateBulletinType(normalizeOptionalString(body.defaultBulletinType)),
      priority_date: validatePriorityDate(normalizeOptionalString(body.priorityDate)),
      green_card_issue_date: validateGreenCardIssueDate(
        normalizeOptionalString(body.greenCardIssueDate),
      ),
      married_to_us_citizen: validateMarriedToUsCitizen(body.marriedToUsCitizen),
    });

    return NextResponse.json({ immigrationProfile });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
