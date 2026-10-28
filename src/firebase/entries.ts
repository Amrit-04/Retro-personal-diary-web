/**
 * The diary's data API. UI modules call these functions and never touch the
 * Firestore SDK, so the SDK stays inside this folder and inside lazy chunks.
 *
 * Read strategy, cheapest first:
 *   1. session cache — an entry whose month or recent window is already in memory
 *   2. one bounded query — never the whole collection
 * Every date here is a local calendar date; see lib/dates.ts.
 */
import { isLive } from './app';
import { daysAgo, isDateId, monthOf, today, yearOf } from '../lib/dates';

export interface Entry {
  date: string;
  title: string;
  content: string;
  imageUrl: string;
  thumbUrl: string;
  imagePath: string;
  thumbPath: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthCount {
  month: number;
  count: number;
}

export type YearSpan = { earliest: string; latest: string } | null;

/** Implemented by store-live.ts (Firestore) and store-demo.ts (local sample data). */
export interface Store {
  recent(limit: number): Promise<Entry[]>;
  yearSpan(): Promise<YearSpan>;
  monthCounts(year: number): Promise<MonthCount[]>;
  monthEntries(year: number, month: number): Promise<Entry[]>;
  byDate(date: string): Promise<Entry | null>;
  save(entry: Entry): Promise<void>;
  remove(date: string): Promise<void>;
}

const RECENT_DAYS = 7;

let storePromise: Promise<Store> | null = null;

function store(): Promise<Store> {
  if (!storePromise) {
    storePromise = isLive ? import('./store-live') : import('./store-demo');
  }
  return storePromise;
}

/**
 * Session caches. A fetched month holds every entry of that month (at most one per
 * day, at most 31 days), and the recent window holds every entry of the last seven
 * days, so "not in a complete cache" is proof of absence — going Back costs no reads.
 */
const recentCache = new Map<string, Entry[]>();
const monthCache = new Map<string, Entry[]>();
const countsCache = new Map<number, MonthCount[]>();
const singleCache = new Map<string, Entry | null>();
let yearSpanCache: YearSpan | undefined;

export function usingDemoData(): boolean {
  return !isLive;
}

/** Desktop row: the last 7 calendar days that have entries, newest first. */
export async function getRecentEntries(): Promise<Entry[]> {
  const key = today();
  const cached = recentCache.get(key);
  if (cached) return cached;

  const entries = await (await store()).recent(RECENT_DAYS);
  recentCache.set(key, entries);
  return entries;
}

/**
 * The archive's year list from two limit(1) reads — the oldest and the newest
 * document — instead of downloading the collection to group it in the browser.
 */
export async function getYearSpan(): Promise<YearSpan> {
  if (yearSpanCache !== undefined) return yearSpanCache;
  yearSpanCache = await (await store()).yearSpan();
  return yearSpanCache;
}

/** Months that have at least one entry, with counts, oldest first. */
export async function getMonthCounts(year: number): Promise<MonthCount[]> {
  const cached = countsCache.get(year);
  if (cached) return cached;

  const months = await (await store()).monthCounts(year);
  months.sort((a, b) => a.month - b.month);
  countsCache.set(year, months);
  return months;
}

/** One month at a time: at most 31 documents, chronological, content included. */
export async function getEntriesForMonth(year: number, month: number): Promise<Entry[]> {
  const key = monthKey(year, month);
  const cached = monthCache.get(key);
  if (cached) return cached;

  const entries = await (await store()).monthEntries(year, month);
  monthCache.set(key, entries);
  return entries;
}

/** Opens one entry, at zero reads when its month or the recent window is cached. */
export async function getEntry(date: string): Promise<Entry | null> {
  if (!isDateId(date)) return null;

  const known = findCached(date);
  if (known !== undefined) return known;

  const entry = await (await store()).byDate(date);
  singleCache.set(date, entry);
  return entry;
}

/** Cached entry, cached miss (null), or undefined when nothing covers this date. */
function findCached(date: string): Entry | null | undefined {
  if (singleCache.has(date)) return singleCache.get(date) ?? null;

  const key = monthKey(yearOf(date), monthOf(date));
  if (monthCache.has(key)) return monthCache.get(key)!.find((e) => e.date === date) ?? null;

  const window = recentCache.get(today());
  if (window && isWithinRecentWindow(date)) return window.find((e) => e.date === date) ?? null;

  return undefined;
}
/** After a save or delete the caches would be stale, so drop them all. */
export function invalidateEntries(): void {
  recentCache.clear();
  monthCache.clear();
  countsCache.clear();
  singleCache.clear();
  yearSpanCache = undefined;
}

/** Used by the admin editor; the entry is already fully formed. */
export async function saveEntry(entry: Entry): Promise<void> {
  await (await store()).save(entry);
  invalidateEntries();
}

export async function deleteEntry(date: string): Promise<void> {
  await (await store()).remove(date);
  invalidateEntries();
}

function isWithinRecentWindow(date: string): boolean {
  return date >= daysAgo(RECENT_DAYS - 1) && date <= today();
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
