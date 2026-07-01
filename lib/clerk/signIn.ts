import { clerkAppearance } from "@/lib/clerk/appearance";
import { emailOnlyAuthElements } from "@/lib/clerk/emailOnly";
import { PROFILE_HUB_EXIT_PATH } from "@/lib/onboarding/routes";

export const clerkSignInAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    ...emailOnlyAuthElements,
  },
};

/**
 * Shared props for the prebuilt <SignIn /> component.
 *
 * Email and password are enforced by Clerk instance settings
 * (config/clerk/sign-up.patch.json and Dashboard). Disable all SSO
 * connections in the Clerk Dashboard to keep auth email-only.
 */
export const clerkSignInProps = {
  appearance: clerkSignInAppearance,
  signUpUrl: "/signup",
  fallbackRedirectUrl: PROFILE_HUB_EXIT_PATH,
} as const;
