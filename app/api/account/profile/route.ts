import { NextResponse } from "next/server";
import { validatePhoneContact } from "@/lib/account/phoneNumber";
import {
  validateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/account/notificationPreferences";
import { AuthError } from "@/lib/auth/errors";
import { authErrorResponse } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/requireUser";
import {
  updateImmigrationProfilePreferences,
  updateProfileContact,
} from "@/lib/supabase/profiles";

export const runtime = "nodejs";

type PatchBody = {
  countryCode?: unknown;
  phoneLocalNumber?: unknown;
  customCountryCode?: unknown;
  notificationPreferences?: unknown;
};

function hasPhoneFields(body: PatchBody): boolean {
  return (
    body.countryCode !== undefined ||
    body.phoneLocalNumber !== undefined ||
    body.customCountryCode !== undefined
  );
}

export async function PATCH(request: Request) {
  try {
    const profileWithRelations = await requireUser();
    const body = (await request.json()) as PatchBody;

    const savingPhone = hasPhoneFields(body);
    const savingNotifications = body.notificationPreferences !== undefined;

    if (!savingPhone && !savingNotifications) {
      throw new AuthError("No valid fields to update.", 400);
    }

    let profile = profileWithRelations.profile;
    let immigrationProfile = profileWithRelations.immigrationProfile;

    if (savingPhone) {
      const phoneNumber = validatePhoneContact({
        countryCode: body.countryCode,
        phoneLocalNumber: body.phoneLocalNumber,
        customCountryCode: body.customCountryCode,
      });

      profile = await updateProfileContact(profileWithRelations.profile.id, {
        phone_number: phoneNumber,
      });
    }

    if (savingNotifications) {
      let notificationPreferences: NotificationPreferences;
      try {
        notificationPreferences = validateNotificationPreferences(body.notificationPreferences);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Invalid notificationPreferences.";
        throw new AuthError(message, 400);
      }

      immigrationProfile = await updateImmigrationProfilePreferences(
        profileWithRelations.profile.id,
        {
          notificationPreferences,
          automatedAlertsOptIn: notificationPreferences.smsAlerts,
        },
      );
    }

    return NextResponse.json({ profile, immigrationProfile });
  } catch (error: unknown) {
    return authErrorResponse(error);
  }
}
