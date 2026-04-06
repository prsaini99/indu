/**
 * Add minutes to an "HH:mm" time string and return the new "HH:mm" string.
 * Wraps around midnight (e.g. 23:30 + 60 = 00:30).
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Format a Date as "YYYY-MM-DD" in UTC.
 */
export function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
