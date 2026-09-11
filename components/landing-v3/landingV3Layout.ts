/**
 * Single horizontal content grid for Landing V3 preview.
 * Announcement, nav, Hero text, body sections, and final CTA share the same
 * left/right content edges. Section backgrounds remain full-bleed.
 * Do not use on `/` or `/landing-v2`.
 */
export const landingV3ContentGridClass =
  "landing-v3-content-grid mx-auto w-full px-4 sm:px-6 lg:px-8";

/** Chrome + Hero text content wrapper — same grid as body. */
export const landingV3ContainerClass = landingV3ContentGridClass;

/** Final CTA / explicit body container — same grid as Hero text. */
export const landingV3BodyContainerClass = landingV3ContentGridClass;

/**
 * Wrapper that widens nested `.container-main` used by WorkspaceSection /
 * V2 body components — V3-scoped only, so shared shells stay unchanged.
 */
export const landingV3BodyShellClass = "landing-v3-body landing-v6-body";
