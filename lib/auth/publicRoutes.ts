/**
 * Routes that do not require authentication (middleware).
 * Public exploration surfaces per BUSINESS_MODEL.md — landing, pricing, manual calculators.
 */

export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/pricing",
  "/calculators(.*)",
  "/immigration/h1b-wage-level-estimator(.*)",
  "/immigration/h1b-lottery-odds-calculator(.*)",
  "/immigration/visa-stamping-wait-map(.*)",
  "/api/visa-stamping-wait-times(.*)",
  "/api/check-priority-date(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)",
  "/sitemap.xml",
  "/robots.txt",
] as const;

function normalizePathname(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

/** Manual immigration calculators and the calculators index (Free tier — BUSINESS_MODEL §13). */
export function isPublicCalculatorPath(path: string): boolean {
  const pathname = normalizePathname(path);
  return (
    pathname === "/calculators" ||
    pathname.startsWith("/calculators/") ||
    pathname === "/immigration/h1b-wage-level-estimator" ||
    pathname === "/immigration/h1b-lottery-odds-calculator" ||
    pathname === "/immigration/visa-stamping-wait-map"
  );
}

/** Paths safe to navigate without sign-in. */
export function isPublicLandingPath(path: string): boolean {
  const pathname = normalizePathname(path);
  return (
    pathname === "/" ||
    pathname === "" ||
    pathname === "/pricing" ||
    isPublicCalculatorPath(pathname)
  );
}

/** Whether a href should prompt login when the visitor is signed out. */
export function requiresAuthForNavigation(href: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
    return false;
  }

  return !isPublicLandingPath(href);
}
