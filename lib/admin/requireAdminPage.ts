import { redirect } from "next/navigation";
import { isAuthError } from "@/lib/auth/errors";
import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Shared server gate for Admin Dashboard mock routes. Does not change requireAdmin(). */
export async function requireAdminPage(): Promise<void> {
  try {
    await requireAdmin();
  } catch (error: unknown) {
    if (isAuthError(error)) {
      if (error.status === 401) {
        redirect("/login");
      }

      redirect("/");
    }

    throw error;
  }
}
