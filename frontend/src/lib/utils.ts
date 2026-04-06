import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Get the browser's IANA timezone */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Get UTC offset in minutes for a given IANA timezone */
function getUtcOffsetMinutes(timezone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  });
  const parts = formatter.formatToParts(new Date());
  const tzPart = parts.find((p) => p.type === "timeZoneName");
  if (!tzPart) return 0;
  const match = tzPart.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3] || "0", 10));
}

/**
 * Convert "HH:mm" from one timezone to another.
 * Example: convertTime("16:00", "Asia/Kolkata", "Asia/Dubai") → "14:30"
 */
export function convertTime(time: string, fromTz: string, toTz: string): string {
  if (fromTz === toTz) return time;
  const diff = getUtcOffsetMinutes(toTz) - getUtcOffsetMinutes(fromTz);
  const [h, m] = time.split(":").map(Number);
  let total = h * 60 + m + diff;
  if (total < 0) total += 1440;
  else if (total >= 1440) total -= 1440;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

/** Convert "HH:mm" (24hr) to "h:mm AM/PM" (12hr) */
export function formatTime(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

/**
 * Convert time from a source timezone to the viewer's local timezone, then format as 12hr.
 * Use this everywhere you display a time to the user.
 * @param time "HH:mm" in the source timezone
 * @param fromTz IANA timezone the time is stored in (e.g. tutor's timezone)
 */
export function displayTime(time: string, fromTz: string): string {
  const viewerTz = getBrowserTimezone();
  const converted = convertTime(time, fromTz, viewerTz);
  return formatTime(converted);
}

/** Add minutes to an "HH:mm" string and return a new "HH:mm" string */
function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Display a time range like "8:00 PM - 9:00 PM" from start time + duration.
 * Converts from the source timezone to viewer's local timezone.
 */
export function displayTimeRange(startTime: string, duration: number, fromTz: string): string {
  const endTime = addMinutes(startTime, duration);
  return `${displayTime(startTime, fromTz)} - ${displayTime(endTime, fromTz)}`;
}
