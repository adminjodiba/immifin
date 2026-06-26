import { SignUp } from "@clerk/nextjs";
import { ClerkAuthShell } from "@/components/auth/ClerkAuthShell";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create your Immifin account.",
  path: "/signup",
});

export default function SignUpPage() {
  return (
    <ClerkAuthShell
      breadcrumb="Sign Up"
      title="Create your account"
      description="Join Immifin to track immigration tools and resources."
    >
      <SignUp
        appearance={clerkAppearance}
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </ClerkAuthShell>
  );
}
