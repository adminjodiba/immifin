const LOGIN_PATH = "/login";

/** Sanitize in-app return paths — block open redirects. */
export function sanitizeReturnPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }

  return trimmed;
}

export function buildSignInUrl(returnPath: string): string {
  const safePath = sanitizeReturnPath(returnPath);
  const params = new URLSearchParams({ redirect_url: safePath });
  return `${LOGIN_PATH}?${params.toString()}`;
}
