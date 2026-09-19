import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  PUBLIC_ROUTE_PATTERNS,
  isPublicVisaBulletinSearchPath,
} from "@/lib/auth/publicRoutes";

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTE_PATTERNS]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request) || isPublicVisaBulletinSearchPath(request.nextUrl.pathname)) {
    return;
  }

  await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
