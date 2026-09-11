import { SignIn } from "@clerk/nextjs";
import { Ds2AuthPageShell } from "@/components/ds2/Ds2AuthPageShell";
import { ds2ClerkSignInAppearance } from "@/lib/clerk/ds2AuthAppearance";
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
    <Ds2AuthPageShell
      description="Sign in to access your Immifin account."
      promise="Know where you stand. Stay informed when things change."
    >
      <SignIn
        {...clerkSignInProps}
        appearance={ds2ClerkSignInAppearance}
        fallbackRedirectUrl={redirectUrl}
      />
    </Ds2AuthPageShell>
  );
}
