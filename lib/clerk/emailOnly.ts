/**
 * UI overrides for email-only authentication.
 *
 * Social sign-in buttons and the Connected Accounts profile section are controlled
 * primarily in the Clerk Dashboard (SSO connections). These appearance rules hide
 * any social UI that remains visible when providers are disabled or in development.
 */
export const emailOnlyAuthElements = {
  socialButtons: { display: "none" },
  socialButtonsBlockButton: { display: "none" },
  dividerRow: { display: "none" },
} as const;

export const emailOnlyUserProfileElements = {
  profileSection__connectedAccounts: { display: "none" },
} as const;
