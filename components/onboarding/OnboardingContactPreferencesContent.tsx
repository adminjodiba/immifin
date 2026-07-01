"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import { POST_ONBOARDING_REDIRECT_PATH } from "@/lib/onboarding/routes";

export function OnboardingContactPreferencesContent() {
  const router = useRouter();

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
          router.replace(POST_ONBOARDING_REDIRECT_PATH);
        }
      } catch {
        // Keep user on onboarding if status check fails.
      }
    }

    void skipIfComplete();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="w-full max-w-md">
      <ContactProfileSection
        variant="onboarding"
        onSaved={() => router.push(POST_ONBOARDING_REDIRECT_PATH)}
      />
    </div>
  );
}
