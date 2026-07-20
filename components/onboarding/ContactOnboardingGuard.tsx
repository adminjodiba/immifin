"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
import {
  clearContactStatusCache,
  getContactStatusCache,
  setContactStatusCache,
} from "@/lib/onboarding/contactStatusCache";
import { ONBOARDING_CONTACT_PATH } from "@/lib/onboarding/routes";

type ContactOnboardingGuardProps = {
  children: ReactNode;
  /** Skip guard for signed-out visitors (e.g. public homepage). */
  publicLanding?: boolean;
};

export function ContactOnboardingGuard({
  children,
  publicLanding = false,
}: ContactOnboardingGuardProps) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [checkingPhone, setCheckingPhone] = useState(() => {
    if (publicLanding) {
      return false;
    }

    if (userId && getContactStatusCache(userId) === "ok") {
      return false;
    }

    return true;
  });

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      clearContactStatusCache();
      setCheckingPhone(false);
      return;
    }

    const cached = getContactStatusCache(userId);
    if (cached === "ok") {
      setCheckingPhone(false);
      return;
    }

    if (cached === "needs_phone") {
      router.replace(ONBOARDING_CONTACT_PATH);
      return;
    }

    let cancelled = false;

    // Public landing: keep the page visible and check once in the background.
    // Protected pages: block briefly until the one-time check completes.
    if (!publicLanding) {
      setCheckingPhone(true);
    }

    async function checkContactStatus() {
      try {
        const response = await fetch("/api/account/contact-status");
        const result = await readJsonResponseBody<{ hasPhone?: boolean }>(response);

        if (cancelled) {
          return;
        }

        if (!result.ok || result.data.hasPhone !== false) {
          setContactStatusCache(userId!, "ok");
          setCheckingPhone(false);
          return;
        }

        setContactStatusCache(userId!, "needs_phone");
        router.replace(ONBOARDING_CONTACT_PATH);
      } catch {
        if (!cancelled) {
          setCheckingPhone(false);
        }
      }
    }

    void checkContactStatus();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, router, publicLanding]);

  if (publicLanding && (!isLoaded || !userId)) {
    return <>{children}</>;
  }

  if (checkingPhone) {
    return (
      <div className="section-padding !pt-10 sm:!pt-16" aria-busy="true" aria-live="polite">
        <div className="container-main">
          <p className="text-center text-sm text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
