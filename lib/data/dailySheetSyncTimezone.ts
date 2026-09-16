export const IMMIFIN_OPERATIONAL_TIMEZONE = "America/Chicago";
export const DAILY_SHEET_SYNC_LOCAL_HOUR = 0;
export const DAILY_SHEET_SYNC_LOCAL_MINUTE = 1;

export const DAILY_SHEET_SYNC_CRON_UTC = ["1 5 * * *", "1 6 * * *"] as const;

export function getChicagoClock(now: Date = new Date()): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IMMIFIN_OPERATIONAL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? "NaN"),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "NaN"),
  };
}

/** True only at 12:01 AM America/Chicago (DST-safe). */
export function isChicagoDailySyncMinute(now: Date = new Date()): boolean {
  const clock = getChicagoClock(now);
  return (
    clock.hour === DAILY_SHEET_SYNC_LOCAL_HOUR &&
    clock.minute === DAILY_SHEET_SYNC_LOCAL_MINUTE
  );
}
