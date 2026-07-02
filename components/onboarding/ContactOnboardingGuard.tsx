"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { readJsonResponseBody } from "@/lib/http/readJsonResponse";
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
  const [checkingPhone, setCheckingPhone] = useState(!publicLanding);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!userId) {
      setCheckingPhone(false);
      return;
    }

    let cancelled = false;
    setCheckingPhone(true);

    async function checkContactStatus() {
      try {
        const response = await fetch("/api/account/contact-status");
        const result = await readJsonResponseBody<{ hasPhone?: boolean }>(response);

        if (cancelled) {
          return;
        }

        if (!result.ok || result.data.hasPhone !== false) {
          setCheckingPhone(false);
          return;
        }

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
  }, [isLoaded, userId, router]);

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
