import { clerkAppearance } from "@/lib/clerk/appearance";
import { clerkSignInAppearance } from "@/lib/clerk/signIn";
import { clerkSignUpAppearance } from "@/lib/clerk/signUp";

/**
 * Clerk appearance for /login and /signup DS2 chrome only.
 * Does not replace shared clerkAppearance used by Header, modal SignIn, or User Profile.
 */
const ds2AuthVariables = {
  ...clerkAppearance.variables,
  colorPrimary: "var(--immifin-ds2-navy)",
  colorText: "var(--immifin-ds2-text-primary)",
  colorTextSecondary: "var(--immifin-ds2-text-muted)",
  colorBackground: "var(--immifin-ds2-surface)",
  colorInputBackground: "var(--immifin-ds2-surface)",
  colorInputText: "var(--immifin-ds2-text-primary)",
  borderRadius: "0.5rem",
} as const;

export const ds2ClerkSignInAppearance = {
  ...clerkSignInAppearance,
  variables: ds2AuthVariables,
  elements: {
    ...clerkSignInAppearance.elements,
    rootBox: "ds2-auth-clerk-root w-full max-w-md",
    card: "ds2-auth-clerk-card",
    headerTitle: "ds2-auth-clerk-title",
    headerSubtitle: "ds2-auth-clerk-subtitle",
    formButtonPrimary: "ds2-auth-clerk-submit",
    formFieldInput: "ds2-auth-clerk-input",
    footerActionLink: "ds2-auth-clerk-link",
    identityPreviewEditButton: "ds2-auth-clerk-link",
  },
};

export const ds2ClerkSignUpAppearance = {
  ...clerkSignUpAppearance,
  variables: ds2AuthVariables,
  elements: {
    ...clerkSignUpAppearance.elements,
    rootBox: "ds2-auth-clerk-root w-full max-w-md",
    card: "ds2-auth-clerk-card",
    headerTitle: "ds2-auth-clerk-title",
    headerSubtitle: "ds2-auth-clerk-subtitle",
    formButtonPrimary: "ds2-auth-clerk-submit",
    formFieldInput: "ds2-auth-clerk-input",
    formFieldLabel: "ds2-auth-clerk-label",
    formFieldAction: "ds2-auth-clerk-link",
    footerActionLink: "ds2-auth-clerk-link",
  },
};
