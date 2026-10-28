/**
 * Firestore implementation, on `firebase/firestore/lite`.
 *
 * The brief asks for `getCountFromServer`; Firebase retired that name and the lite SDK
 * now exports its replacement `getCount(query)` — the same server-side count (one
 * document read, no documents downloaded). Using it keeps us on lite instead of
 * falling back to the much larger full SDK.
 */
import {
  collection,
  deleteDoc,
  doc,
  getCount,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore/lite';
import { firebaseApp } from './app';
import { daysAgo, monthRange, today } from '../lib/dates';
import type { Entry, MonthCount, YearSpan } from './entries';

let instance: Firestore | null = null;

function db(): Firestore {
  if (!instance) instance = getFirestore(firebaseApp());
  return instance;
}

const all = () => collection(db(), 'entries');

export async function recent(limitCount: number): Promise<Entry[]> {
  const snapshot = await getDocs(
    query(
      all(),
      where('date', '>=', daysAgo(limitCount - 1)),
      where('date', '<=', today()),
      orderBy('date', 'desc'),
      limit(limitCount),
    ),
  );
  return snapshot.docs.map((item) => toEntry(item.id, item.data()));
}

/** Two limit(1) reads give the whole archive range the explorer needs. */
export async function yearSpan(): Promise<YearSpan> {
  const [oldest, newest] = await Promise.all([
    getDocs(query(all(), orderBy('date', 'asc'), limit(1))),
    getDocs(query(all(), orderBy('date', 'desc'), limit(1))),
  ]);

  if (oldest.empty || newest.empty) return null;
  return { earliest: oldest.docs[0].id, latest: newest.docs[0].id };
}

/** Twelve parallel counts, one document read each, never the documents themselves. */
export async function monthCounts(year: number): Promise<MonthCount[]> {
  const results = await Promise.all(
    Array.from({ length: 12 }, (_, index) => index + 1).map(async (month) => {
      const { start, end } = monthRange(year, month);
      const snapshot = await getCount(
        query(all(), where('date', '>=', start), where('date', '<=', end)),
      );
      return { month, count: snapshot.data().count };
    }),
  );

  return results.filter((item) => item.count > 0);
}

export async function monthEntries(year: number, month: number): Promise<Entry[]> {
  const { start, end } = monthRange(year, month);
  const snapshot = await getDocs(
    query(all(), where('date', '>=', start), where('date', '<=', end), orderBy('date', 'asc')),
  );
  return snapshot.docs.map((item) => toEntry(item.id, item.data()));
}

export async function byDate(date: string): Promise<Entry | null> {
  const snapshot = await getDoc(doc(db(), 'entries', date));
  return snapshot.exists() ? toEntry(snapshot.id, snapshot.data()) : null;
}

/** The document id is the date, so the store keeps one entry per day by construction. */
export async function save(entry: Entry): Promise<void> {
  await setDoc(doc(db(), 'entries', entry.date), {
    date: entry.date,
    title: entry.title,
    content: entry.content,
    imageUrl: entry.imageUrl,
    thumbUrl: entry.thumbUrl,
    imagePath: entry.imagePath,
    thumbPath: entry.thumbPath,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  });
}

export async function remove(date: string): Promise<void> {
  await deleteDoc(doc(db(), 'entries', date));
}

type Wire = Record<string, unknown>;

function toEntry(id: string, raw: Wire): Entry {
  return {
    date: id,
    title: text(raw.title),
    content: text(raw.content),
    imageUrl: text(raw.imageUrl),
    thumbUrl: text(raw.thumbUrl),
    imagePath: text(raw.imagePath),
    thumbPath: text(raw.thumbPath),
    createdAt: asDate(raw.createdAt),
    updatedAt: asDate(raw.updatedAt),
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  const timestamp = value as Timestamp | null;
  return typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(0);
}
