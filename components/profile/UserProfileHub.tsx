"use client";

import { UserProfile } from "@clerk/nextjs";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { GreenCardProfilePage } from "@/components/profile/GreenCardProfilePage";
import { ImmigrationProfilePage } from "@/components/profile/ImmigrationProfilePage";
import { ImmigrationProfileProvider } from "@/components/profile/ImmigrationProfileProvider";
import { NotificationsProfilePage } from "@/components/profile/NotificationsProfilePage";
import { SubscriptionProfilePage } from "@/components/profile/SubscriptionProfilePage";
import { ProfileDirtyStateProvider } from "@/components/profile/ProfileDirtyStateProvider";
import { FavoriteStar } from "@/components/favorites/FavoriteStar";
import { UserProfileCloseAction } from "@/components/profile/UserProfileCloseAction";
import {
  ContactTabIcon,
  GreenCardTabIcon,
  ImmigrationTabIcon,
  NotificationTabIcon,
} from "@/components/profile/ProfilePageIcons";
import { useCanUseDevSubscriptionTools } from "@/lib/hooks/useCanUseDevSubscriptionTools";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  canAccessNotifications,
  canAccessSaveImmigrationProfile,
} from "@/lib/subscription/capabilities";
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
  const { tier } = useEffectiveSubscriptionTier();
  const { canUse: devSubscriptionMode } = useCanUseDevSubscriptionTools();
  const notificationsLocked = !canAccessNotifications(tier);
  const immigrationProfileLocked = !canAccessSaveImmigrationProfile(tier);

  return (
    <ProfileDirtyStateProvider>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <h1 className="text-xl font-bold tracking-tight text-brand-900 sm:text-2xl">Manage Profile</h1>
          <FavoriteStar pageLabel="Manage Profile" pageHref="/user-profile" />
        </div>
        <UserProfileCloseAction />
      </header>
      <ImmigrationProfileProvider>
        <UserProfile routing="hash" appearance={userProfileAppearance}>
          <UserProfile.Page label="account" />
          <UserProfile.Page label="security" />
          {devSubscriptionMode ? (
            <UserProfile.Page
              label="Subscription"
              url="subscription"
              labelIcon={<ImmigrationTabIcon />}
            >
              <SubscriptionProfilePage />
            </UserProfile.Page>
          ) : null}
          <UserProfile.Page label="Contact" url="contact" labelIcon={<ContactTabIcon />}>
            <ContactProfileSection />
          </UserProfile.Page>
          <UserProfile.Page
            label={notificationsLocked ? "Notifications 🔒 PRO" : "Notifications"}
            url="notifications"
            labelIcon={<NotificationTabIcon />}
          >
            <NotificationsProfilePage />
          </UserProfile.Page>
          <UserProfile.Page
            label={immigrationProfileLocked ? "Immigration 🔒 PRO" : "Immigration"}
            url="immigration"
            labelIcon={<ImmigrationTabIcon />}
          >
            <ImmigrationProfilePage />
          </UserProfile.Page>
          <UserProfile.Page
            label={immigrationProfileLocked ? "Green Card 🔒 PRO" : "Green Card"}
            url="green-card"
            labelIcon={<GreenCardTabIcon />}
          >
            <GreenCardProfilePage />
          </UserProfile.Page>
        </UserProfile>
      </ImmigrationProfileProvider>
    </ProfileDirtyStateProvider>
  );
}
