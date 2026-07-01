import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfilePhoneStatus } from "@/lib/account/hasProfilePhone";
import {
  ONBOARDING_CONTACT_PATH,
  PROFILE_HUB_EXIT_PATH,
} from "@/lib/onboarding/routes";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/account(.*)",
  "/api/account(.*)",
  "/user-profile(.*)",
  "/onboarding(.*)",
]);

const isContactOnboardingRoute = createRouteMatcher([ONBOARDING_CONTACT_PATH]);

const requiresContactRoute = createRouteMatcher([
  "/account(.*)",
  "/user-profile(.*)",
  "/admin(.*)",
]);

const isContactOnboardingExemptRoute = createRouteMatcher([
  "/signup(.*)",
  "/login(.*)",
  "/onboarding(.*)",
  "/api/webhooks(.*)",
  "/api/account/contact-status",
  "/api/account/me",
  "/api/account/profile",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const { userId } = await auth();

  if (!userId) {
    return;
  }

  const needsPhoneCheck =
    isContactOnboardingRoute(request) ||
    (requiresContactRoute(request) && !isContactOnboardingExemptRoute(request));

  if (!needsPhoneCheck) {
    return;
  }

  const hasPhone = await getProfilePhoneStatus(userId);

  if (isContactOnboardingRoute(request)) {
    if (hasPhone === true) {
      return NextResponse.redirect(new URL(PROFILE_HUB_EXIT_PATH, request.url));
    }

    return;
  }

  if (hasPhone === false) {
    return NextResponse.redirect(new URL(ONBOARDING_CONTACT_PATH, request.url));
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
