/**
 * Visitor chrome (header/footer ProtectedLink) public destinations.
 *
 * Middleware PUBLIC_ROUTE_PATTERNS still own HTTP reachability.
 * This helper only answers: should signed-out navigation skip Login Required?
 *
 * Keep this list limited to routes that already return HTTP 200 unsigned.
 * Do not add /immigration landing, History, Movement, Finance, or Insurance here.
 */

import {
  isPublicCalculatorPath,
  isPublicCurrentVisaBulletinPath,
  isPublicLandingPath,
} from "@/lib/auth/publicRoutes";

function normalizePathname(path: string): string {
  return path.split("?")[0]?.split("#")[0] ?? path;
}

/**
 * Destinations that signed-out header/footer clicks may follow without
 * opening Login Required.
 */
export function isPublicNavigationPath(path: string): boolean {
  const pathname = normalizePathname(path);

  if (isPublicLandingPath(pathname)) {
    return true;
  }

  if (pathname === "/pricing") {
    return true;
  }

  if (isPublicCurrentVisaBulletinPath(pathname)) {
    return true;
  }

  return isPublicCalculatorPath(pathname);
}

/**
 * Whether a chrome href should open Login Required when the visitor is signed out.
 */
export function requiresAuthForNavigation(href: string): boolean {
  if (!href || href.startsWith("http") || href.startsWith("mailto:")) {
    return false;
  }

  return !isPublicNavigationPath(href);
}
