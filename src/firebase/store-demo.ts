/**
 * Local sample store, used only when no Firebase project is configured, so the whole
 * experience can be opened and tried before credentials exist. It is a separate lazy
 * chunk: with real config this file is never requested.
 *
 * Security note: this store is browser-only. Nothing here relaxes a rule — the live
 * store is still governed by firestore.rules and storage.rules.
 */
import { daysAgo, monthOf, today, yearOf } from '../lib/dates';
import type { Entry, MonthCount, YearSpan } from './entries';

const STORAGE_KEY = 'diaryxp.demo-entries';

/** 1x1-ish SVG doodles: a few hundred bytes, no binary asset needed. */
function doodle(colors: [string, string, string], label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${colors[0]}"/>
    <circle cx="120" cy="100" r="52" fill="${colors[1]}"/>
    <path d="M20 250 L150 160 L260 230 L400 150 L400 300 L0 300 Z" fill="${colors[2]}"/>
    <text x="20" y="40" font-family="Tahoma,sans-serif" font-size="28" fill="#ffffff">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function seeded(): Entry[] {
  const now = new Date();
  const make = (offset: number, title: string, content: string, palette: [string, string, string]): Entry => {
    const date = daysAgo(offset);
    const image = doodle(palette, title.slice(0, 14));
    return {
      date,
      title,
      content,
      imageUrl: image,
      thumbUrl: image,
      imagePath: `entries/${date}/demo-display.svg`,
      thumbPath: `entries/${date}/demo-thumb.svg`,
      createdAt: new Date(now.getTime() - offset * 86400000),
      updatedAt: new Date(now.getTime() - offset * 86400000),
    };
  };

  return [
    make(0, 'Today at the lab', 'Ran the boot sequence on a throttled phone and it still felt\nsmooth. The BIOS lines land before the JS does, which is\nthe whole trick.', ['#1f5fbf', '#7fb2ff', '#0b3b8c']),
    make(1, 'Coffee and compilers', 'Third cup. Rewrote the window manager so Back closes the\ntop window instead of leaving the history tangled.', ['#5c4033', '#d7a86e', '#2b1d17']),
    make(3, 'A quiet Tuesday', 'Nothing happened, which is worth writing down too.', ['#2e7d32', '#a5d6a7', '#1b5e20']),
    make(40, 'Last month, moving desks', 'Older entry so the archive has more than one year to show.', ['#7b1fa2', '#ce93d8', '#4a148c']),
    make(400, 'A winter note', 'The first page of the diary.', ['#00695c', '#80cbc4', '#004d40']),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
}

let cache: Entry[] | null = null;

function all(): Entry[] {
  if (cache) return cache;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    cache = stored ? (JSON.parse(stored) as Entry[]) : seeded();
  } catch {
    cache = seeded();
  }
  return cache!;
}

function persist(entries: Entry[]): void {
  cache = entries;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* Private mode: the sample data simply resets on reload. */
  }
}

export async function recent(limitCount: number): Promise<Entry[]> {
  const floor = daysAgo(limitCount - 1);
  return all().filter((entry) => entry.date >= floor && entry.date <= today()).slice(0, limitCount);
}

export async function yearSpan(): Promise<YearSpan> {
  const list = all();
  if (!list.length) return null;
  const dates = list.map((entry) => entry.date).sort();
  return { earliest: dates[0], latest: dates[dates.length - 1] };
}

export async function monthCounts(year: number): Promise<MonthCount[]> {
  const counts = new Map<number, number>();
  for (const entry of all()) {
    if (yearOf(entry.date) !== year) continue;
    counts.set(monthOf(entry.date), (counts.get(monthOf(entry.date)) ?? 0) + 1);
  }
  return [...counts].map(([month, count]) => ({ month, count }));
}

export async function monthEntries(year: number, month: number): Promise<Entry[]> {
  return all()
    .filter((entry) => yearOf(entry.date) === year && monthOf(entry.date) === month)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function byDate(date: string): Promise<Entry | null> {
  return all().find((entry) => entry.date === date) ?? null;
}

export async function save(entry: Entry): Promise<void> {
  const rest = all().filter((item) => item.date !== entry.date);
  persist([...rest, entry].sort((a, b) => (a.date < b.date ? 1 : -1)));
}

export async function remove(date: string): Promise<void> {
  persist(all().filter((entry) => entry.date !== date));
}
