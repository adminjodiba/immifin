const IMMIGRATION_WORKSPACE_PATHS = new Set([
  "/immigration",
  "/immigration/visa-bulletin",
  "/immigration/visa-bulletin-history",
  "/immigration/visa-bulletin-movement",
  "/immigration/h1b-wage-level-estimator",
  "/immigration/h1b-lottery-odds-calculator",
  "/immigration/visa-stamping-wait-map",
  "/calculators/green-card-wait-time",
  "/calculators/citizenship-eligibility",
  "/intelligence",
]);

/**
 * Canonical Immigration workspace destinations only. Keep this exact-match
 * allowlist narrow so public Immigration SEO routes retain the normal Header.
 */
export function isImmigrationWorkspacePath(pathname: string): boolean {
  return IMMIGRATION_WORKSPACE_PATHS.has(pathname);
}