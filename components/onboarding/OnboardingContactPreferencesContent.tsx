"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import { markContactStatusOk, setContactStatusCache } from "@/lib/onboarding/contactStatusCache";
import { POST_ONBOARDING_REDIRECT_PATH } from "@/lib/onboarding/routes";

export function OnboardingContactPreferencesContent() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function skipIfComplete() {
      try {
        const response = await fetch("/api/account/contact-status");
        const result = await readJsonResponseBody<{ hasPhone?: boolean }>(response);

        if (!result.ok) {
          return;
        }

        if (!cancelled && result.data.hasPhone) {
          if (userId) {
            markContactStatusOk(userId);
          }
          router.replace(POST_ONBOARDING_REDIRECT_PATH);
        } else if (!cancelled && userId && result.data.hasPhone === false) {
          setContactStatusCache(userId, "needs_phone");
        }
      } catch {
        // Keep user on onboarding if status check fails.
      }
    }

    void skipIfComplete();

    return () => {
      cancelled = true;
    };
  }, [router, userId]);

  return (
    <div className="w-full max-w-md">
      <ContactProfileSection
        variant="onboarding"
        onSaved={() => {
          if (userId) {
            markContactStatusOk(userId);
          }
          router.push(POST_ONBOARDING_REDIRECT_PATH);
        }}
      />
    </div>
  );
}
