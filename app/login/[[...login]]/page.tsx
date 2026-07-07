import { SignIn } from "@clerk/nextjs";
import { ClerkAuthShell } from "@/components/auth/ClerkAuthShell";
import { clerkSignInProps } from "@/lib/clerk/signIn";
import { sanitizeReturnPath } from "@/lib/auth/signInRedirect";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Sign In",
  description: "Sign in to your Immifin account.",
  path: "/login",
});

type LoginPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url
    ? sanitizeReturnPath(params.redirect_url)
    : clerkSignInProps.fallbackRedirectUrl;

  return (
    <ClerkAuthShell
      title="Welcome back"
      description="Sign in to access your Immifin account."
    >
      <SignIn {...clerkSignInProps} fallbackRedirectUrl={redirectUrl} />
    </ClerkAuthShell>
  );
}
