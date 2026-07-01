/**
 * Edge-safe phone status lookup for middleware and API routes.
 * Uses Supabase REST directly so middleware does not import @supabase/supabase-js.
 */
export async function getProfilePhoneStatus(clerkUserId: string): Promise<boolean | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.error("[contact-status] Missing Supabase configuration.");
    return null;
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/profiles?clerk_user_id=eq.${encodeURIComponent(clerkUserId)}&select=phone_number`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        `[contact-status] Supabase lookup failed with status ${response.status}.`,
      );
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.error("[contact-status] Supabase lookup returned non-JSON response.");
      return null;
    }

    const rows = (await response.json()) as { phone_number?: string | null }[];
    const phoneNumber = rows[0]?.phone_number?.trim() ?? "";
    return phoneNumber.length > 0;
  } catch (error: unknown) {
    console.error("[contact-status] Failed to load profile phone status:", error);
    return null;
  }
}
