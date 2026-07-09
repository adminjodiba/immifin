/**
 * Convert Department of State-style wait strings to approximate days.
 * Uses 1 month = 30 days.
 */
export function parseWaitTimeToDays(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  if (/^(n\/a|na|not available|unavailable|-)$/i.test(normalized)) {
    return null;
  }

  const calendarDays = normalized.match(/^(\d+(?:\.\d+)?)\s+calendar\s+days?$/i);
  if (calendarDays) {
    return Math.round(Number(calendarDays[1]));
  }

  const days = normalized.match(/^(\d+(?:\.\d+)?)\s+days?$/i);
  if (days) {
    return Math.round(Number(days[1]));
  }

  if (/^<\s*0\.5\s+months?$/i.test(normalized)) {
    return 15;
  }

  const months = normalized.match(/^(\d+(?:\.\d+)?)\s+months?$/i);
  if (months) {
    return Math.round(Number(months[1]) * 30);
  }

  return null;
}
