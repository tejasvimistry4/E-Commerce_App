/**
 * Central Date and Time Utility Helpers
 * Provides standardized, locale-consistent date formatting, relative time calculation,
 * parsing, validation, and comparison across customer and admin modules.
 */

/**
 * Default date & time format options matching standard admin/storefront UI:
 * e.g., "Sep 15, 2026, 10:20 AM"
 */
const DEFAULT_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Standard short date options:
 * e.g., "15 Sep 2026"
 */
const DEFAULT_DATE_ONLY_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

/**
 * Safely parses any date representation (string, Date, timestamp number) into a valid Date object.
 * Returns null if the input is empty, null, undefined, or an invalid date string.
 *
 * @param date - Date object, ISO string, timestamp, or null/undefined
 */
export const parseDate = (date?: string | number | Date | null): Date | null => {
  if (!date) return null;
  try {
    const d = typeof date === "object" && date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Checks if a given input represents a valid date.
 *
 * @param date - Input date value to test
 */
export const isValidDate = (date?: string | number | Date | null): boolean => {
  return parseDate(date) !== null;
};

/**
 * Formats a Date object or ISO date string to a localized readable format.
 * Returns fallback string (default: "N/A") for empty, null, undefined, or invalid dates.
 *
 * @param date - Date object, ISO string, or undefined/null
 * @param options - Custom Intl.DateTimeFormatOptions
 * @param locale - Locale identifier (default: "en-US")
 * @param fallback - Fallback string when date is missing or invalid (default: "N/A")
 */
export const formatDate = (
  date?: string | number | Date | null,
  options: Intl.DateTimeFormatOptions = DEFAULT_DATETIME_OPTIONS,
  locale: string = "en-US",
  fallback: string = "N/A"
): string => {
  const parsed = parseDate(date);
  if (!parsed) return fallback;
  try {
    return new Intl.DateTimeFormat(locale, options).format(parsed);
  } catch {
    return fallback;
  }
};

/**
 * Formats a Date object or ISO string to standard date-only format (e.g. "Sep 15, 2026").
 */
export const formatDateOnly = (
  date?: string | number | Date | null,
  locale: string = "en-US",
  fallback: string = "N/A"
): string => {
  return formatDate(date, DEFAULT_DATE_ONLY_OPTIONS, locale, fallback);
};

/**
 * Formats a Date object or ISO string to standard locale datetime.
 */
export const formatDateTime = (
  date?: string | number | Date | null,
  locale: string = "en-US",
  fallback: string = "N/A"
): string => {
  return formatDate(date, DEFAULT_DATETIME_OPTIONS, locale, fallback);
};

/**
 * Calculates human-readable relative time difference from now (e.g., "Just now", "5m ago", "2h ago", "Yesterday", "3d ago", "Sep 15").
 * Returns an empty string for missing or invalid dates.
 *
 * @param date - Date object, ISO string, or undefined/null
 */
export const formatTimeAgo = (date?: string | number | Date | null): string => {
  const d = parseDate(date);
  if (!d) return "";

  try {
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "In the future";

    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return "Just now";

    const diffMins = Math.floor(diffSeconds / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

/**
 * Formats a Date object or ISO string to standard full datetime for notifications (e.g., "Thu, 18 Sep 2026, 11:25 am").
 */
export const formatFullDateTime = (
  date?: string | number | Date | null,
  locale: string = "en-IN",
  fallback: string = "N/A"
): string => {
  return formatDate(
    date,
    {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    locale,
    fallback
  );
};

/**
 * Converts a Date or ISO date string to "YYYY-MM-DDTHH:mm" format for <input type="datetime-local" />.
 */
export const formatDateForInput = (
  date?: string | number | Date | null
): string => {
  const d = parseDate(date);
  if (!d) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

/**
 * Converts a datetime-local input string into an ISO 8601 string or null for API payloads.
 */
export const formatInputToIso = (
  dateStr?: string | null
): string | null => {
  if (!dateStr || !dateStr.trim()) return null;
  const d = parseDate(dateStr);
  return d ? d.toISOString() : null;
};

/**
 * Validates that an end date is not earlier than a start date.
 */
export const isValidDateRange = (
  startDate?: string | number | Date | null,
  endDate?: string | number | Date | null
): boolean => {
  if (!startDate || !endDate) return true;
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return true;
  return end.getTime() >= start.getTime();
};

/**
 * Formats a date range display string (e.g. "12/10/2026 ➔ 20/10/2026").
 */
export const formatDateRange = (
  startDate?: string | number | Date | null,
  endDate?: string | number | Date | null,
  fallbackStart = "Immediate",
  fallbackEnd = "Indefinite"
): string => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const startText = start ? start.toLocaleDateString() : fallbackStart;
  const endText = end ? end.toLocaleDateString() : fallbackEnd;
  return `${startText} ➔ ${endText}`;
};

/**
 * Formats remaining time until a target end date into a human-readable countdown string (e.g. "2d 4h left" or "45m left").
 */
export const getRemainingTimeText = (
  endDateStr?: string | number | Date | null
): string | null => {
  const end = parseDate(endDateStr);
  if (!end) return null;
  const now = Date.now();
  const diff = end.getTime() - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h ${minutes}m left`;
};

/**
 * Helper comparator to sort two dates in ascending or descending order.
 */
export const compareDates = (
  a?: string | number | Date | null,
  b?: string | number | Date | null,
  order: "asc" | "desc" = "desc"
): number => {
  const timeA = parseDate(a)?.getTime() || 0;
  const timeB = parseDate(b)?.getTime() || 0;
  return order === "asc" ? timeA - timeB : timeB - timeA;
};

/**
 * Checks if two dates occur on the same calendar day.
 */
export const isSameDay = (
  date1?: string | number | Date | null,
  date2?: string | number | Date | null
): boolean => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Returns the difference in calendar days between two dates.
 */
export const getDaysDifference = (
  startDate?: string | number | Date | null,
  endDate?: string | number | Date | null
): number => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) return 0;
  const diffMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Checks if a given timestamp falls within a specified cooldown duration from now.
 */
export const isWithinCooldown = (
  date?: string | number | Date | null,
  cooldownMinutes: number = 15
): boolean => {
  const d = parseDate(date);
  if (!d) return false;
  const elapsedMs = Date.now() - d.getTime();
  return elapsedMs < cooldownMinutes * 60 * 1000;
};
