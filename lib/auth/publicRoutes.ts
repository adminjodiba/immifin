/**
 * Routes that do not require authentication (middleware).
 * Public exploration surfaces — landing, pricing, manual calculators, and
 * public Visa Bulletin search children (`/immigration/visa-bulletin/:category/:country`).
 * The Current Visa Bulletin Dashboard (`/immigration/visa-bulletin`) and
 * `GET /api/visa-bulletin` require login. Never use visa-bulletin(.*).
 */

export const PUBLIC_ROUTE_PATTERNS = [
  "/",
  "/landing-v2",
  "/landing-v3",
  "/landing-v7",
  "/articles(.*)",
  "/pricing",
  "/life",
  "/about(.*)",
  "/contact(.*)",
  "/api/contact(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/calculators(.*)",
  "/immigration/h1b-wage-level-estimator(.*)",
  "/immigration/h1b-lottery-odds-calculator(.*)",
  "/immigration/visa-stamping-wait-map(.*)",
  // Two-segment public search pages only: /immigration/visa-bulletin/{category}/{country}.
  // Do NOT use (.*) or a trailing-slash prefix — extra segments must stay denied.
  // The exact parent `/immigration/visa-bulletin` is a private product dashboard.
  "/immigration/visa-bulletin/:category/:country",
  "/api/visa-stamping-wait-times(.*)",
  "/api/check-priority-date(.*)",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)",
  // Intelligence Ask enforces auth inside the route so clients receive JSON 401
  // (not an HTML login redirect from middleware auth.protect).
  "/api/intelligence/ask(.*)",
  // Feedback submit enforces auth inside the route so clients receive JSON 401
  // (not an HTML login redirect from middleware auth.protect).
  "/api/feedback(.*)",
  // Cron self-call; route authenticates with DAILY_SHEET_SYNC_SECRET.
  "/api/internal/daily-sheet-sync(.*)",
  "/sitemap.xml",
  "/robots.txt",
] as const;

function normalizePathname(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

/** Exact Current Visa Bulletin Dashboard path (private product). Not a public-access flag. */
export function isPublicCurrentVisaBulletinPath(path: string): boolean {
  return normalizePathname(path) === "/immigration/visa-bulletin";
}

const PUBLIC_VISA_BULLETIN_SEARCH_PATH =
  /^\/immigration\/visa-bulletin\/[^/]+\/[^/]+\/?$/;

/**
 * Public Visa Bulletin search children — exactly two path segments.
 * `/immigration/visa-bulletin/eb2/india` is public; History/Movement are not.
 * Invalid slugs still match so Next.js `notFound()` can run.
 */
export function isPublicVisaBulletinSearchPath(path: string): boolean {
  return PUBLIC_VISA_BULLETIN_SEARCH_PATH.test(normalizePathname(path));
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

/**
 * Paths safe to navigate without sign-in from site chrome (header/footer).
 * Protected menus/submenus (everything except Home / About family) prompt login.
 * Middleware may still allow broader public exploration via PUBLIC_ROUTE_PATTERNS.
 */
export function isPublicLandingPath(path: string): boolean {
  const pathname = normalizePathname(path);
  return (
    pathname === "/" ||
    pathname === "" ||
    pathname === "/landing-v2" ||
    pathname === "/landing-v3" ||
    pathname === "/landing-v7" ||
    pathname === "/articles" ||
    pathname.startsWith("/articles/") ||
    pathname === "/life" ||
    pathname === "/about" ||
    pathname.startsWith("/about/") ||
    pathname === "/contact" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  );
}

/** Whether a href should prompt login when the visitor is signed out. */
export function requiresAuthForNavigation(href: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
    return false;
  }

  return !isPublicLandingPath(href);
}
