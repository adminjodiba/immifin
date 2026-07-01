export const AUTOMATED_ALERTS_OPT_IN_KEY = "automatedAlertsOptIn";
export const NOTIFICATION_PREFERENCES_KEY = "notificationPreferences";

export type NotificationPreferences = {
  smsAlerts: boolean;
  emailAlerts: boolean;
  visaBulletinUpdates: boolean;
  priorityDateCurrent: boolean;
  citizenshipReminders: boolean;
  marketing: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  smsAlerts: false,
  emailAlerts: true,
  visaBulletinUpdates: true,
  priorityDateCurrent: true,
  citizenshipReminders: true,
  marketing: false,
};

export const NOTIFICATION_PREFERENCE_FIELDS: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: "smsAlerts",
    label: "SMS alerts",
    description: "Receive immigration alerts by text message when enabled.",
  },
  {
    key: "emailAlerts",
    label: "Email alerts",
    description: "Receive immigration alerts by email.",
  },
  {
    key: "visaBulletinUpdates",
    label: "Visa bulletin updates",
    description: "Get notified when new visa bulletin data is available.",
  },
  {
    key: "priorityDateCurrent",
    label: "Priority date current",
    description: "Get notified when your priority date becomes current.",
  },
  {
    key: "citizenshipReminders",
    label: "Citizenship reminders",
    description: "Receive reminders related to citizenship eligibility.",
  },
  {
    key: "marketing",
    label: "Marketing and product updates",
    description: "Receive occasional product news and promotional updates.",
  },
];

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function readNotificationPreferences(
  preferences: Record<string, unknown> | undefined,
): NotificationPreferences {
  const stored = preferences?.[NOTIFICATION_PREFERENCES_KEY];

  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    const record = stored as Record<string, unknown>;
    return {
      smsAlerts: readBoolean(record.smsAlerts, DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts),
      emailAlerts: readBoolean(record.emailAlerts, DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts),
      visaBulletinUpdates: readBoolean(
        record.visaBulletinUpdates,
        DEFAULT_NOTIFICATION_PREFERENCES.visaBulletinUpdates,
      ),
      priorityDateCurrent: readBoolean(
        record.priorityDateCurrent,
        DEFAULT_NOTIFICATION_PREFERENCES.priorityDateCurrent,
      ),
      citizenshipReminders: readBoolean(
        record.citizenshipReminders,
        DEFAULT_NOTIFICATION_PREFERENCES.citizenshipReminders,
      ),
      marketing: readBoolean(record.marketing, DEFAULT_NOTIFICATION_PREFERENCES.marketing),
    };
  }

  if (preferences?.[AUTOMATED_ALERTS_OPT_IN_KEY] === true) {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      smsAlerts: true,
    };
  }

  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export function validateNotificationPreferences(value: unknown): NotificationPreferences {
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("notificationPreferences must be an object.");
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES) as (keyof NotificationPreferences)[];

  for (const key of keys) {
    if (typeof record[key] !== "boolean") {
      throw new Error(`${String(key)} must be a boolean.`);
    }
  }

  return {
    smsAlerts: record.smsAlerts as boolean,
    emailAlerts: record.emailAlerts as boolean,
    visaBulletinUpdates: record.visaBulletinUpdates as boolean,
    priorityDateCurrent: record.priorityDateCurrent as boolean,
    citizenshipReminders: record.citizenshipReminders as boolean,
    marketing: record.marketing as boolean,
  };
}

// Legacy helper kept for webhook/backward compatibility reads.
export function readAutomatedAlertsOptIn(
  preferences: Record<string, unknown> | undefined,
): boolean {
  return readNotificationPreferences(preferences).smsAlerts;
}
