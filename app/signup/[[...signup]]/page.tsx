import { SignUpPageContent } from "@/components/auth/SignUpPageContent";
import { ClerkAuthShell } from "@/components/auth/ClerkAuthShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create your Immifin account.",
  path: "/signup",
});

export default function SignUpPage() {
  return (
    <ClerkAuthShell
      title="Create your account"
      description="Join Immifin to track immigration tools and resources."
    >
      <SignUpPageContent />
    </ClerkAuthShell>
  );
}
