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
 * Appearance for <SignIn /> embedded in the guest Login Required modal.
 * Softens the nested "card in a card" look while keeping form controls clear.
 * Does not hide Clerk security, legal, or Development mode indicators.
 */
export const clerkModalSignInAppearance = {
  ...clerkSignInAppearance,
  elements: {
    ...clerkSignInAppearance.elements,
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full rounded-xl border-0 bg-transparent p-0 shadow-none",
    headerTitle: "text-lg font-semibold text-brand-900",
    headerSubtitle: "text-sm text-slate-600",
    footer: "bg-transparent",
  },
};

/**
 * Auth copy localization (ClerkProvider).
 * Ensures brand capitalization IMMIFIN in SignIn headings.
 */
export const clerkAuthLocalization = {
  signIn: {
    start: {
      title: "Sign in to IMMIFIN",
      subtitle: "Welcome back! Please sign in to continue",
    },
  },
} as const;

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

/** Props for SignIn inside the guest Login Required modal. */
export const clerkModalSignInProps = {
  ...clerkSignInProps,
  appearance: clerkModalSignInAppearance,
} as const;
