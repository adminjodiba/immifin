import { clerkAppearance } from "@/lib/clerk/appearance";

/**
 * Sign-up appearance extends the shared Clerk theme with field-level styling
 * for the identity capture step (name, email, password, optional photo).
 */
export const clerkSignUpAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    formFieldInput:
      "rounded-xl border-slate-200 focus:border-brand-500 focus:ring-brand-200",
    formFieldLabel: "text-sm font-medium text-slate-700",
    formFieldLabelRow: "mb-1.5",
    formFieldAction: "text-brand-700 hover:text-brand-800",
    avatarBox: "rounded-xl ring-1 ring-slate-200/80",
    avatarImageActionsUpload: "text-brand-700 hover:text-brand-800",
  },
};

/**
 * Shared props for the prebuilt <SignUp /> component.
 *
 * Field requirements (first name, last name, email, password required;
 * profile image optional) are enforced by Clerk instance settings in
 * config/clerk/sign-up.patch.json — apply with:
 *   npm run clerk:config:signup
 */
export const clerkSignUpProps = {
  appearance: clerkSignUpAppearance,
  signInUrl: "/login",
  fallbackRedirectUrl: "/",
} as const;
