"use client";

import { useEffect } from "react";
import { ContactProfileSection } from "@/components/profile/ContactProfileSection";
import { GreenCardProfileSection } from "@/components/profile/GreenCardProfileSection";
import { ImmigrationProfileProvider } from "@/components/profile/ImmigrationProfileProvider";
import { ImmigrationProfileSection } from "@/components/profile/ImmigrationProfileSection";
import { MyProfileActionBar } from "@/components/profile/MyProfileActionBar";
import { MyProfileWorkspaceLayout } from "@/components/profile/MyProfileWorkspaceLayout";
import { NotificationPreferencesSection } from "@/components/profile/NotificationPreferencesSection";
import { ProfileDirtyStateProvider } from "@/components/profile/ProfileDirtyStateProvider";
import { parseMyProfileHash } from "@/lib/profile/myProfileSection";

const QUADRANT_IDS: Record<string, string> = {
  contact: "profile-contact",
  immigration: "profile-immigration",
  "green-card": "profile-green-card",
  notifications: "profile-notifications",
};

function scrollToHashQuadrant() {
  const section = parseMyProfileHash(window.location.hash);
  const id = QUADRANT_IDS[section];
  if (!id) {
    return;
  }
  document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" });
}

export function UserProfileHub() {
  useEffect(() => {
    scrollToHashQuadrant();
    window.addEventListener("hashchange", scrollToHashQuadrant);
    return () => window.removeEventListener("hashchange", scrollToHashQuadrant);
  }, []);

  return (
    <ProfileDirtyStateProvider>
      <MyProfileWorkspaceLayout>
        <ImmigrationProfileProvider>
          <MyProfileActionBar />
          <div className="ds2-profile-quadrants">
            <ContactProfileSection />
            <ImmigrationProfileSection />
            <GreenCardProfileSection />
            <NotificationPreferencesSection />
          </div>
        </ImmigrationProfileProvider>
      </MyProfileWorkspaceLayout>
    </ProfileDirtyStateProvider>
  );
}
