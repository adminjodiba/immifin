"use client";

import { UserProfile } from "@clerk/nextjs";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { GreenCardProfileSection } from "@/components/profile/GreenCardProfileSection";
import { ImmigrationProfileProvider } from "@/components/profile/ImmigrationProfileProvider";
import { ImmigrationProfileSection } from "@/components/profile/ImmigrationProfileSection";
import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";
import {
  ContactTabIcon,
  GreenCardTabIcon,
  ImmigrationTabIcon,
  NotificationTabIcon,
} from "@/components/profile/ProfilePageIcons";
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

export function UserProfileHub() {
  return (
    <ImmigrationProfileProvider>
      <UserProfile routing="hash" appearance={userProfileAppearance}>
        <UserProfile.Page label="account" />
        <UserProfile.Page label="security" />
        <UserProfile.Page label="Contact" url="contact" labelIcon={<ContactTabIcon />}>
          <ContactProfileSection />
        </UserProfile.Page>
        <UserProfile.Page
          label="Notifications"
          url="notifications"
          labelIcon={<NotificationTabIcon />}
        >
          <NotificationPreferencesSection />
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
