import { ClerkAuthShell } from "@/components/auth/ClerkAuthShell";
import { OnboardingContactPreferencesContent } from "@/components/onboarding/OnboardingContactPreferencesContent";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact Preferences",
  description: "Complete your Immifin contact and notification preferences.",
  path: "/onboarding/contact-preferences",
});

export default function ContactPreferencesOnboardingPage() {
  return (
    <ClerkAuthShell
      title="Complete your profile"
      description="Add your phone number to finish account setup. You only need to do this once."
    >
      <OnboardingContactPreferencesContent />
    </ClerkAuthShell>
  );
}
