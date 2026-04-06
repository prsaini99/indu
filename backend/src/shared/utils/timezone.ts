/**
 * Timezone conversion utilities.
 *
 * All "HH:mm" times stored in the DB represent the user's LOCAL time
 * in their IANA timezone (stored on the User record).
 *
 * These helpers convert between timezones so that:
 *  - Tutors see times in their timezone (e.g. "Asia/Kolkata")
 *  - Parents see times in their timezone (e.g. "Asia/Dubai")
 *  - Matching/generation uses a common reference for comparison
 */

/**
 * Get the UTC offset in minutes for a given IANA timezone on a given date.
 * Positive = ahead of UTC (e.g. IST = +330, GST = +240).
 */
export function getUtcOffsetMinutes(timezone: string, date: Date = new Date()): number {
  // Build a formatter that outputs the numeric offset
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p) => p.type === 'timeZoneName');
  if (!tzPart) return 0;

  // tzPart.value looks like "GMT+5:30" or "GMT-4" or "GMT+4"
  const match = tzPart.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] || '0', 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Convert a "HH:mm" time from one timezone to another.
 *
 * Returns { time: "HH:mm", dayShift: -1 | 0 | 1 }
 *  - dayShift indicates if the conversion crossed midnight
 *    (e.g. 01:00 IST → previous day in an earlier timezone)
 */
export function convertTime(
  time: string,
  fromTimezone: string,
  toTimezone: string,
  referenceDate: Date = new Date()
): { time: string; dayShift: number } {
  if (fromTimezone === toTimezone) {
    return { time, dayShift: 0 };
  }

  const fromOffset = getUtcOffsetMinutes(fromTimezone, referenceDate);
  const toOffset = getUtcOffsetMinutes(toTimezone, referenceDate);
  const diff = toOffset - fromOffset; // minutes to add

  const [h, m] = time.split(':').map(Number);
  let totalMinutes = h * 60 + m + diff;

  let dayShift = 0;
  if (totalMinutes < 0) {
    totalMinutes += 1440; // 24 * 60
    dayShift = -1;
  } else if (totalMinutes >= 1440) {
    totalMinutes -= 1440;
    dayShift = 1;
  }

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return {
    time: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`,
    dayShift,
  };
}

/**
 * Convert a "HH:mm" time from a user's local timezone to UTC.
 */
export function localToUtc(time: string, timezone: string, referenceDate?: Date): { time: string; dayShift: number } {
  return convertTime(time, timezone, 'UTC', referenceDate);
}

/**
 * Convert a "HH:mm" time from UTC to a user's local timezone.
 */
export function utcToLocal(time: string, timezone: string, referenceDate?: Date): { time: string; dayShift: number } {
  return convertTime(time, 'UTC', timezone, referenceDate);
}

/**
 * Shift a day-of-week (0=Sun..6=Sat) by dayShift (-1, 0, or 1).
 */
export function shiftDay(dayOfWeek: number, dayShift: number): number {
  return ((dayOfWeek + dayShift) % 7 + 7) % 7;
}
