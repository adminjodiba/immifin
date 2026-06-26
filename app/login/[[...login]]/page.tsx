import { SignIn } from "@clerk/nextjs";
import { ClerkAuthShell } from "@/components/auth/ClerkAuthShell";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your Immifin account.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <ClerkAuthShell
      breadcrumb="Sign In"
      title="Welcome back"
      description="Sign in to access your Immifin account."
    >
      <SignIn
        appearance={clerkAppearance}
        signUpUrl="/signup"
        fallbackRedirectUrl="/"
      />
    </ClerkAuthShell>
  );
}
