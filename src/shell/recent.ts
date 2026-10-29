/**
 * The last-seven-days list, held once for the whole desktop.
 *
 * Icons and the Start menu both want it, and entries.ts already caches the query for
 * the session, so this is a thin signal layer over that cache rather than a second
 * data source. A save or a delete calls refresh(), which drops the cache and reads
 * again.
 */
import { signal } from '@preact/signals';
import { getRecentEntries, type Entry } from '../firebase/entries';

export const recent = signal<Entry[] | null>(null);
export const recentError = signal<string | null>(null);

const FAILURE = 'The diary could not be reached. Check the connection and try again.';

let inFlight: Promise<void> | null = null;

export function loadRecent(): Promise<void> {
  if (recent.value !== null) return Promise.resolve();
  return (inFlight ??= read());
}

/** After a write the cache in entries.ts is already invalid, so this re-reads. */
export function refreshRecent(): Promise<void> {
  inFlight = read();
  return inFlight;
}

async function read(): Promise<void> {
  try {
    recent.value = await getRecentEntries();
    recentError.value = null;
  } catch {
    recentError.value = FAILURE;
  } finally {
    inFlight = null;
  }
}

export function retryRecent(): Promise<void> {
  recentError.value = null;
  inFlight = read();
  return inFlight;
}
