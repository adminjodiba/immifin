import { NextResponse } from "next/server";
import {
  addFavoritePage,
  FavoritesLimitError,
  FAVORITES_PREFERENCES_KEY,
  readFavorites,
  removeFavoritePage,
  validateFavoriteInput,
} from "@/lib/account/favorites";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import { canAccessFavorites } from "@/lib/subscription/capabilities";
import { getStoredSubscriptionTier } from "@/lib/subscription/service";
import { updateImmigrationProfilePreferences } from "@/lib/supabase/profiles";

export const runtime = "nodejs";

function getTier(profileWithRelations: Awaited<ReturnType<typeof requireUser>>) {
  return getStoredSubscriptionTier({
    profile: profileWithRelations.profile,
    subscription: profileWithRelations.subscription,
  });
}

function assertFavoritesManageAccess(profileWithRelations: Awaited<ReturnType<typeof requireUser>>) {
  if (!canAccessFavorites(getTier(profileWithRelations))) {
    throw new AuthError("Favorites are available in Pro.", 403);
  }
}

export async function GET() {
  try {
    const profileWithRelations = await requireUser();
    const tier = getTier(profileWithRelations);
    const preferences = profileWithRelations.immigrationProfile?.preferences ?? {};
    const favorites = readFavorites(preferences);
    const accessLocked = !canAccessFavorites(tier);

    return NextResponse.json({ favorites, accessLocked });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    assertFavoritesManageAccess(profileWithRelations);

    const body = (await request.json()) as unknown;
    const input = validateFavoriteInput(body);
    const preferences = profileWithRelations.immigrationProfile?.preferences ?? {};
    const currentFavorites = readFavorites(preferences);

    let nextFavorites;
    try {
      nextFavorites = addFavoritePage(currentFavorites, input);
    } catch (error: unknown) {
      if (error instanceof FavoritesLimitError) {
        return NextResponse.json({ error: error.message, code: "FAVORITES_LIMIT" }, { status: 409 });
      }
      throw error;
    }

    const immigrationProfile = await updateImmigrationProfilePreferences(
      profileWithRelations.profile.id,
      { [FAVORITES_PREFERENCES_KEY]: nextFavorites },
    );

    return NextResponse.json({
      favorites: readFavorites(immigrationProfile.preferences),
      accessLocked: false,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    assertFavoritesManageAccess(profileWithRelations);

    const body = (await request.json()) as unknown;
    const input = validateFavoriteInput(body);
    const preferences = profileWithRelations.immigrationProfile?.preferences ?? {};
    const nextFavorites = removeFavoritePage(readFavorites(preferences), input.href);

    const immigrationProfile = await updateImmigrationProfilePreferences(
      profileWithRelations.profile.id,
      { [FAVORITES_PREFERENCES_KEY]: nextFavorites },
    );

    return NextResponse.json({
      favorites: readFavorites(immigrationProfile.preferences),
      accessLocked: false,
    });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
