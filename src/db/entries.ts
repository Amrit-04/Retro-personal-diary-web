import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, isConfigured } from '../firebase';
import { DiaryEntry } from '../types';
import { deleteDoodleImage } from './images';
import { getDateDaysAgo, getTodayDateString, MONTH_NAMES } from '../utils/date';

const ENTRIES_COLLECTION = 'entries';

// In-memory demo store if Firebase is not yet configured
let mockEntries: Map<string, DiaryEntry> = new Map();

function initDemoData() {
  if (mockEntries.size > 0) return;

  const today = getTodayDateString();
  const d1 = getDateDaysAgo(1);
  const d3 = getDateDaysAgo(3);
  const d5 = getDateDaysAgo(5);

  const sampleEntries: DiaryEntry[] = [
    {
      date: today,
      title: 'Building the Retro Terminal',
      content: 'Spent the evening assembling the diary application. The CRT phosphor glow and clean bevels bring back memories of early computing. Everything is lightweight and instant.',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a2634"/><path d="M50 200 Q 150 50 250 200 T 350 150" fill="none" stroke="%23ffbf00" stroke-width="4"/><circle cx="200" cy="120" r="40" fill="%2350fa7b"/><text x="140" y="270" font-family="monospace" fill="%238be9fd" font-size="16">Doodle: Cyber-Sun</text></svg>',
      imagePath: 'doodles/sample_today.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: d1,
      title: 'Circuit Board Diagnostics',
      content: 'Found a faulty capacitor on the sound card oscillator. Soldered a replacement and the 8-bit FM synthesis is singing again. Reminded me of building my first custom rig.',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232b213a"/><circle cx="200" cy="150" r="70" fill="%23ff79c6"/><line x1="80" y1="150" x2="320" y2="150" stroke="%23f1fa8c" stroke-width="3"/><line x1="200" y1="30" x2="200" y2="270" stroke="%23f1fa8c" stroke-width="3"/><text x="135" y="260" font-family="monospace" fill="%23f8f8f2" font-size="16">Oscillator Pulse</text></svg>',
      imagePath: 'doodles/sample_d1.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: d3,
      title: 'Midnight Coffee & Compilers',
      content: 'Wrote a recursive descent parser for an experimental query language. Keeping dependencies to absolute zero is satisfying. Code finishes compiling in 12ms.',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230f1419"/><polygon points="200,40 320,240 80,240" fill="%23ff5555" opacity="0.8"/><polygon points="200,100 280,220 120,220" fill="%230f1419"/><text x="145" y="275" font-family="monospace" fill="%2350fa7b" font-size="16">Syntax Tree</text></svg>',
      imagePath: 'doodles/sample_d3.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: d5,
      title: 'Quiet Rain in the Valley',
      content: 'Thunderstorms rolled in right around twilight. Sat by the workshop window listening to the rain tap against the glass. Perfect weather for reading old manuals.',
      imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231e1e2e"/><line x1="100" y1="40" x2="60" y2="240" stroke="%2389b4fa" stroke-width="3"/><line x1="180" y1="60" x2="140" y2="260" stroke="%2389b4fa" stroke-width="3"/><line x1="260" y1="30" x2="220" y2="230" stroke="%2389b4fa" stroke-width="3"/><line x1="330" y1="80" x2="290" y2="280" stroke="%2389b4fa" stroke-width="3"/><text x="150" y="270" font-family="monospace" fill="%23cdd6f4" font-size="16">Rain Drops</text></svg>',
      imagePath: 'doodles/sample_d5.svg',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      date: '2026-08-15',
      title: 'Late Summer Archiving',
      content: 'Organizing old diskettes and floppy backups into labeled storage boxes.',
      imageUrl: undefined,
      createdAt: new Date('2026-08-15T12:00:00Z'),
      updatedAt: new Date('2026-08-15T12:00:00Z'),
    },
    {
      date: '2026-08-02',
      title: 'Solar Flare Observation',
      content: 'Set up the optical telescope with the solar filter. Observed three distinct sunspots near the northern hemisphere of the sun.',
      imageUrl: undefined,
      createdAt: new Date('2026-08-02T10:00:00Z'),
      updatedAt: new Date('2026-08-02T10:00:00Z'),
    },
    {
      date: '2025-11-20',
      title: 'First Log in the New Laboratory',
      content: 'Moved all the test equipment and oscilloscopes into the new workspace. Power rails tested stable at 5.02V and 12.01V.',
      imageUrl: undefined,
      createdAt: new Date('2025-11-20T08:00:00Z'),
      updatedAt: new Date('2025-11-20T08:00:00Z'),
    }
  ];

  for (const entry of sampleEntries) {
    mockEntries.set(entry.date, entry);
  }
}

/**
 * Fetch entries from the last 7 calendar days only.
 * Only queries for the 7-day range to minimize Firestore reads and avoid downloading the entire archive.
 */
export async function getRecentEntries(): Promise<DiaryEntry[]> {
  const startDate = getDateDaysAgo(6); // 6 days ago + today = 7 calendar days
  const endDate = getTodayDateString();

  if (!isConfigured) {
    initDemoData();
    const result: DiaryEntry[] = [];
    for (const [date, entry] of mockEntries.entries()) {
      if (date >= startDate && date <= endDate) {
        result.push(entry);
      }
    }
    // Sort descending by date (most recent first)
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }

  const entriesRef = collection(db, ENTRIES_COLLECTION);
  const q = query(
    entriesRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  const entries: DiaryEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push(docSnap.data() as DiaryEntry);
  });

  return entries;
}

/**
 * Fetch a single diary entry by date (YYYY-MM-DD)
 */
export async function getEntry(date: string): Promise<DiaryEntry | null> {
  if (!date) return null;

  if (!isConfigured) {
    initDemoData();
    return mockEntries.get(date) || null;
  }

  const docRef = doc(db, ENTRIES_COLLECTION, date);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as DiaryEntry;
}

/**
 * Fetch available years in the archive lazily
 */
export async function getArchiveYears(): Promise<number[]> {
  if (!isConfigured) {
    initDemoData();
    const yearsSet = new Set<number>();
    for (const date of mockEntries.keys()) {
      const y = parseInt(date.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }

  // To be ultra-efficient, we query all entries with just the 'date' field or fetch chronological order
  const entriesRef = collection(db, ENTRIES_COLLECTION);
  const q = query(entriesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  const yearsSet = new Set<number>();
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.date) {
      const y = parseInt(data.date.substring(0, 4), 10);
      if (!isNaN(y)) yearsSet.add(y);
    }
  });

  return Array.from(yearsSet).sort((a, b) => b - a);
}

/**
 * Fetch months for a given year lazily with entry counts
 */
export async function getArchiveMonthsForYear(year: number): Promise<{ month: number; monthName: string; count: number }[]> {
  const yearStr = String(year);
  const startDate = `${yearStr}-01-01`;
  const endDate = `${yearStr}-12-31`;

  const monthCounts: Record<number, number> = {};

  if (!isConfigured) {
    initDemoData();
    for (const date of mockEntries.keys()) {
      if (date >= startDate && date <= endDate) {
        const m = parseInt(date.substring(5, 7), 10);
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }
    }
  } else {
    const entriesRef = collection(db, ENTRIES_COLLECTION);
    const q = query(
      entriesRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.date) {
        const m = parseInt(data.date.substring(5, 7), 10);
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }
    });
  }

  const result: { month: number; monthName: string; count: number }[] = [];
  for (let m = 1; m <= 12; m++) {
    if (monthCounts[m]) {
      result.push({
        month: m,
        monthName: MONTH_NAMES[m - 1],
        count: monthCounts[m],
      });
    }
  }

  return result.sort((a, b) => b.month - a.month); // Latest months first
}

/**
 * Fetch all entries for a specific year and month, sorted chronologically (ascending)
 */
export async function getEntriesForMonth(year: number, month: number): Promise<DiaryEntry[]> {
  const yearStr = String(year);
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${yearStr}-${monthStr}-01`;
  // Last day of month
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  if (!isConfigured) {
    initDemoData();
    const result: DiaryEntry[] = [];
    for (const [date, entry] of mockEntries.entries()) {
      if (date >= startDate && date <= endDate) {
        result.push(entry);
      }
    }
    // Chronological order (day 1 -> day 31)
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  const entriesRef = collection(db, ENTRIES_COLLECTION);
  const q = query(
    entriesRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc') // Chronological sorting inside month
  );

  const snapshot = await getDocs(q);
  const entries: DiaryEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push(docSnap.data() as DiaryEntry);
  });

  return entries;
}

/**
 * Save (create or update) a diary entry.
 * Enforced by Firestore Security Rules to require custom claim admin: true.
 */
export async function saveDiaryEntry(
  date: string,
  title: string,
  content: string,
  imageUrl?: string,
  imagePath?: string
): Promise<DiaryEntry> {
  const existing = await getEntry(date);

  // If replacing doodle, delete old doodle from storage
  if (existing && existing.imagePath && imagePath && existing.imagePath !== imagePath) {
    await deleteDoodleImage(existing.imagePath);
  }

  const entryData: DiaryEntry = {
    date,
    title: title.trim(),
    content: content.trim(),
    imageUrl: imageUrl || existing?.imageUrl || undefined,
    imagePath: imagePath || existing?.imagePath || undefined,
    createdAt: existing?.createdAt || (!isConfigured ? new Date() : serverTimestamp()),
    updatedAt: !isConfigured ? new Date() : serverTimestamp(),
  };

  if (!isConfigured) {
    initDemoData();
    mockEntries.set(date, entryData);
    return entryData;
  }

  const docRef = doc(db, ENTRIES_COLLECTION, date);
  await setDoc(docRef, entryData, { merge: true });

  return entryData;
}

/**
 * Delete a diary entry by date. Also cleans up its doodle image in Storage.
 */
export async function deleteDiaryEntry(date: string): Promise<void> {
  const existing = await getEntry(date);

  if (existing && existing.imagePath) {
    await deleteDoodleImage(existing.imagePath);
  }

  if (!isConfigured) {
    initDemoData();
    mockEntries.delete(date);
    return;
  }

  const docRef = doc(db, ENTRIES_COLLECTION, date);
  await deleteDoc(docRef);
}
