/**
 * Every date in this app is a LOCAL calendar date. Firestore document ids and the
 * `date` field are the string "YYYY-MM-DD" built from getFullYear/getMonth/getDate.
 * Never use toISOString() here: it would shift entries across the UTC boundary and
 * a diary written at 11pm would land on the wrong day.
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

const DATE_ID = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateId(value: string): boolean {
  const match = DATE_ID.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

export function today(): string {
  return toDateString(new Date());
}

export function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateId(dateId: string): Date | null {
  const match = DATE_ID.exec(dateId);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Local date `n` days before today, as "YYYY-MM-DD". */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateString(d);
}

export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(year, month, 0).getDate();
}

/** Inclusive string bounds for a month, e.g. 2026, 3 -> "2026-03-01" .. "2026-03-31". */
export function monthRange(year: number, month: number): { start: string; end: string } {
  const padded = String(month).padStart(2, '0');
  return {
    start: `${year}-${padded}-01`,
    end: `${year}-${padded}-${String(daysInMonth(year, month)).padStart(2, '0')}`,
  };
}

export function yearOf(dateId: string): number {
  return Number(dateId.slice(0, 4));
}

export function monthOf(dateId: string): number {
  return Number(dateId.slice(5, 7));
}

/** Newest first, so the archive opens on the most recent year. */
export function yearsBetween(earliest: string, latest: string): number[] {
  const from = yearOf(earliest);
  const to = yearOf(latest);
  const years: number[] = [];
  for (let year = to; year >= from; year--) years.push(year);
  return years;
}

/** "Wednesday, 28 October 2026" */
export function longDate(dateId: string): string {
  const date = fromDateId(dateId);
  if (!date) return dateId;
  return `${WEEKDAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Wed 28 Oct 2026" — used in file lists where space is tight. */
export function shortDate(dateId: string): string {
  const date = fromDateId(dateId);
  if (!date) return dateId;
  return `${WEEKDAY_NAMES[date.getDay()].slice(0, 3)} ${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}
