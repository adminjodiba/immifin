"use client";

import { SignUp } from "@clerk/nextjs";
import { ds2ClerkSignUpAppearance } from "@/lib/clerk/ds2AuthAppearance";
import { clerkSignUpProps } from "@/lib/clerk/signUp";

export function SignUpPageContent() {
  return (
    <div className="w-full max-w-md">
      <SignUp {...clerkSignUpProps} appearance={ds2ClerkSignUpAppearance} />
      <p className="ds2-auth-note">
        After creating your account, you&apos;ll be asked for your phone number and notification
        preferences before continuing.
      </p>
    </div>
  );
}
