import { POST_LOGIN_START_PATH } from "@/lib/account/startPage";

const LOGIN_PATH = "/login";

/** Sanitize in-app return paths — block open redirects. */
export function sanitizeReturnPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}

function pathnameOnly(path: string): string {
  return sanitizeReturnPath(path).split("?")[0]?.split("#")[0] ?? "/";
}

/**
 * General login (Home, /login, resolver) uses the start-page preference.
 * A specific protected destination is an explicit return path and wins.
 */
export function isGeneralLoginReturnPath(path: string): boolean {
  const pathname = pathnameOnly(path);
  return (
    pathname === "/" ||
    pathname === POST_LOGIN_START_PATH ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  );
}

export function resolveLoginReturnPath(path: string): string {
  const safePath = sanitizeReturnPath(path);
  return isGeneralLoginReturnPath(safePath) ? POST_LOGIN_START_PATH : safePath;
}

export function buildSignInUrl(returnPath: string): string {
  const safePath = resolveLoginReturnPath(returnPath);
  const params = new URLSearchParams({ redirect_url: safePath });
  return `${LOGIN_PATH}?${params.toString()}`;
}
