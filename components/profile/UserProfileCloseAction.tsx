"use client";

import { useRouter } from "next/navigation";
import { PROFILE_HUB_EXIT_PATH } from "@/lib/onboarding/routes";

export function UserProfileCloseAction() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="btn-secondary shrink-0"
      onClick={() => router.push(PROFILE_HUB_EXIT_PATH)}
    >
      Close
    </button>
  );
}
