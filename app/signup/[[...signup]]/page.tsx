import { SignUpPageContent } from "@/components/auth/SignUpPageContent";
import { Ds2AuthPageShell } from "@/components/ds2/Ds2AuthPageShell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign Up",
  description: "Create your Immifin account.",
  path: "/signup",
});

export default function SignUpPage() {
  return (
    <Ds2AuthPageShell
      description="Join Immifin to track immigration tools and resources."
      promise="Know where you stand. Stay informed when things change."
    >
      <SignUpPageContent />
    </Ds2AuthPageShell>
  );
}
