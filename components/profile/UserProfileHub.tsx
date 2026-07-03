"use client";

import { UserProfile } from "@clerk/nextjs";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { GreenCardProfileSection } from "@/components/profile/GreenCardProfileSection";
import { ImmigrationProfileProvider } from "@/components/profile/ImmigrationProfileProvider";
import { ImmigrationProfileSection } from "@/components/profile/ImmigrationProfileSection";
import { NotificationsProfilePage } from "@/components/profile/NotificationsProfilePage";
import {
  ContactTabIcon,
  GreenCardTabIcon,
  ImmigrationTabIcon,
  NotificationTabIcon,
} from "@/components/profile/ProfilePageIcons";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import { canAccessNotifications } from "@/lib/subscription/capabilities";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { emailOnlyUserProfileElements } from "@/lib/clerk/emailOnly";

const userProfileAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    rootBox: "w-full min-w-0",
    card: "rounded-2xl border border-slate-200 bg-white shadow-sm",
    navbar: "rounded-t-2xl border-b border-slate-200 overflow-x-auto",
    navbarButtons: "flex flex-nowrap gap-1 overflow-x-auto pb-1 min-w-max",
    navbarButton: "shrink-0 whitespace-nowrap px-3 text-sm",
    pageScrollBox: "rounded-b-2xl",
    ...emailOnlyUserProfileElements,
  },
};

function NotificationsTabIcon({ locked }: { locked: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <NotificationTabIcon />
      {locked ? (
        <span className="rounded bg-brand-100 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-800">
          Pro
        </span>
      ) : null}
    </span>
  );
}

export function UserProfileHub() {
  const { tier } = useEffectiveSubscriptionTier();
  const notificationsLocked = !canAccessNotifications(tier);

  return (
    <ImmigrationProfileProvider>
      <UserProfile routing="hash" appearance={userProfileAppearance}>
        <UserProfile.Page label="account" />
        <UserProfile.Page label="security" />
        <UserProfile.Page label="Contact" url="contact" labelIcon={<ContactTabIcon />}>
          <ContactProfileSection />
        </UserProfile.Page>
        <UserProfile.Page
          label={notificationsLocked ? "Notifications 🔒 PRO" : "Notifications"}
          url="notifications"
          labelIcon={<NotificationsTabIcon locked={notificationsLocked} />}
        >
          <NotificationsProfilePage />
        </UserProfile.Page>
        <UserProfile.Page label="Immigration" url="immigration" labelIcon={<ImmigrationTabIcon />}>
          <ImmigrationProfileSection />
        </UserProfile.Page>
        <UserProfile.Page label="Green Card" url="green-card" labelIcon={<GreenCardTabIcon />}>
          <GreenCardProfileSection />
        </UserProfile.Page>
      </UserProfile>
    </ImmigrationProfileProvider>
  );
}
