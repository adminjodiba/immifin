"use client";

import type { ReactNode } from "react";
import { UserProfile } from "@clerk/nextjs";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { GreenCardProfilePage } from "@/components/profile/GreenCardProfilePage";
import { ImmigrationProfilePage } from "@/components/profile/ImmigrationProfilePage";
import { ImmigrationProfileProvider } from "@/components/profile/ImmigrationProfileProvider";
import { NotificationsProfilePage } from "@/components/profile/NotificationsProfilePage";
import { SubscriptionProfilePage } from "@/components/profile/SubscriptionProfilePage";
import { ProfileDirtyStateProvider } from "@/components/profile/ProfileDirtyStateProvider";
import { UserProfileCloseAction } from "@/components/profile/UserProfileCloseAction";
import {
  ContactTabIcon,
  GreenCardTabIcon,
  ImmigrationTabIcon,
  NotificationTabIcon,
} from "@/components/profile/ProfilePageIcons";
import { useEffectiveSubscriptionTier } from "@/lib/hooks/useEffectiveSubscriptionTier";
import {
  canAccessNotifications,
  canAccessSaveImmigrationProfile,
} from "@/lib/subscription/capabilities";
import { isDevSubscriptionModeEnabled } from "@/lib/subscription/devSubscriptionMode";
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

function ProTabIcon({
  icon,
  locked,
}: {
  icon: ReactNode;
  locked: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
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
  const devSubscriptionMode = isDevSubscriptionModeEnabled();
  const notificationsLocked = !canAccessNotifications(tier);
  const immigrationProfileLocked = !canAccessSaveImmigrationProfile(tier);

  return (
    <ProfileDirtyStateProvider>
      <div className="mb-4 flex justify-end">
        <UserProfileCloseAction />
      </div>
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
            labelIcon={<NotificationsTabIcon locked={notificationsLocked} />}
          >
            <NotificationsProfilePage />
          </UserProfile.Page>
          <UserProfile.Page
            label={immigrationProfileLocked ? "Immigration 🔒 PRO" : "Immigration"}
            url="immigration"
            labelIcon={
              <ProTabIcon icon={<ImmigrationTabIcon />} locked={immigrationProfileLocked} />
            }
          >
            <ImmigrationProfilePage />
          </UserProfile.Page>
          <UserProfile.Page
            label={immigrationProfileLocked ? "Green Card 🔒 PRO" : "Green Card"}
            url="green-card"
            labelIcon={
              <ProTabIcon icon={<GreenCardTabIcon />} locked={immigrationProfileLocked} />
            }
          >
            <GreenCardProfilePage />
          </UserProfile.Page>
        </UserProfile>
      </ImmigrationProfileProvider>
    </ProfileDirtyStateProvider>
  );
}
