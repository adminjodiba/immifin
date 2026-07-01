"use client";

import { SignUp } from "@clerk/nextjs";
import { clerkSignUpProps } from "@/lib/clerk/signUp";

export function SignUpPageContent() {
  return (
    <div className="w-full max-w-md">
      <SignUp {...clerkSignUpProps} />
      <p className="mt-4 text-center text-xs text-slate-500">
        After creating your account, you&apos;ll be asked for your phone number and notification
        preferences before continuing.
      </p>
    </div>
  );
}
