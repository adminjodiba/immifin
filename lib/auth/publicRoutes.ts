/**
 * Routes that do not require authentication (middleware).
 * Landing page `/` only — plus Clerk auth and required public endpoints.
 */
export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)",
  "/sitemap.xml",
  "/robots.txt",
] as const;

/** Paths safe to navigate without sign-in (landing home only). */
export function isPublicLandingPath(path: string): boolean {
  const pathname = path.split("?")[0]?.split("#")[0] ?? path;
  return pathname === "/" || pathname === "";
}

/** Whether a href should prompt login when the visitor is signed out. */
export function requiresAuthForNavigation(href: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
    return false;
  }

  return !isPublicLandingPath(href);
}
