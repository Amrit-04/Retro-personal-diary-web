/**
 * Date utility functions for Retro Diary
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const d = new Date();
  return formatDateToString(d);
}

/**
 * Returns a Date object formatted as YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the date string for N days ago from referenceDate (default: today)
 */
export function getDateDaysAgo(days: number, refDate: Date = new Date()): string {
  const d = new Date(refDate);
  d.setDate(d.getDate() - days);
  return formatDateToString(d);
}

/**
 * Returns the array of YYYY-MM-DD strings for the last 7 calendar days inclusive (from 6 days ago to today)
 */
export function getLast7DaysStrings(): string[] {
  const result: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push(formatDateToString(d));
  }
  return result;
}

/**
 * Parses a YYYY-MM-DD string into year, month (1-12), and day
 */
export function parseDateString(dateStr: string): { year: number; month: number; day: number } | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  };
}

/**
 * Formats a YYYY-MM-DD date into a friendly retro string: e.g. "Sat, Sep 26, 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  const parts = parseDateString(dateStr);
  if (!parts) return dateStr;
  const d = new Date(parts.year, parts.month - 1, parts.day);
  const dayName = DAY_NAMES[d.getDay()].substring(0, 3);
  const monthName = MONTH_SHORT_NAMES[parts.month - 1];
  return `${dayName}, ${monthName} ${parts.day}, ${parts.year}`;
}

/**
 * Formats a YYYY-MM-DD date into a full formal string: e.g. "Saturday, September 26, 2026"
 */
export function formatFullDate(dateStr: string): string {
  const parts = parseDateString(dateStr);
  if (!parts) return dateStr;
  const d = new Date(parts.year, parts.month - 1, parts.day);
  const dayName = DAY_NAMES[d.getDay()];
  const monthName = MONTH_NAMES[parts.month - 1];
  return `${dayName}, ${monthName} ${parts.day}, ${parts.year}`;
}
