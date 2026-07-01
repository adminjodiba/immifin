import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ONBOARDING_CONTACT_PATH } from "@/lib/onboarding/routes";

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/api/admin(.*)",
  "/account(.*)",
  "/api/account(.*)",
  "/user-profile(.*)",
  "/onboarding(.*)",
]);

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

  if (userId && requiresContactRoute(request) && !isContactOnboardingExemptRoute(request)) {
    const statusUrl = new URL("/api/account/contact-status", request.url);
    const statusResponse = await fetch(statusUrl, {
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
    });

    if (statusResponse.ok) {
      const payload = (await statusResponse.json()) as { hasPhone?: boolean };

      if (!payload.hasPhone) {
        return NextResponse.redirect(new URL(ONBOARDING_CONTACT_PATH, request.url));
      }
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
