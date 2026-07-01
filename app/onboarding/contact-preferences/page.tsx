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
      breadcrumb="Onboarding"
      title="Contact preferences"
      description="We need your phone number and alert preferences before you continue."
    >
      <OnboardingContactPreferencesContent />
    </ClerkAuthShell>
  );
}
