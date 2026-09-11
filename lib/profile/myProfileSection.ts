export const MY_PROFILE_TAB_IDS = ["contact", "immigration", "green-card", "notifications"] as const;

export type MyProfileTabId = (typeof MY_PROFILE_TAB_IDS)[number];

export type MyProfileSectionId = MyProfileTabId | "subscription";

export const MY_PROFILE_TAB_LABELS: Record<MyProfileTabId, string> = {
  contact: "Personal Info",
  immigration: "Immigration",
  "green-card": "Green Card",
  notifications: "Notifications",
};

export function parseMyProfileHash(hash: string): MyProfileSectionId {
  const value = decodeURIComponent(hash.replace(/^#\/?/, "")).toLowerCase();

  if (value === "immigration") {
    return "immigration";
  }
  if (value === "green-card" || value === "greencard") {
    return "green-card";
  }
  if (value === "notifications" || value === "notification") {
    return "notifications";
  }
  if (value === "subscription") {
    return "subscription";
  }

  return "contact";
}

export function myProfileHashFor(section: MyProfileSectionId): string {
  return `#/${section}`;
}
