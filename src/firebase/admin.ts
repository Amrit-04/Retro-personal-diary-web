/**
 * Admin-only file work: deleting the Storage objects that belong to an entry.
 *
 * This is the only module that imports firebase/storage, and it is reached only
 * through a dynamic import from an admin action. A reader — signed in or not —
 * never downloads the Storage SDK. Uploads land here too, from the editor chunk.
 */
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  type UploadResult,
} from 'firebase/storage';
import { firebaseApp, isLive } from './app';
import { deleteEntry, type Entry } from './entries';
import { extensionFor, type Prepared } from '../lib/image';

export interface EntryImages {
  imageUrl: string;
  thumbUrl: string;
  imagePath: string;
  thumbPath: string;
}

/** File names are unique per upload, so the response can be cached forever. */
const IMMUTABLE = 'public,max-age=31536000,immutable';

/**
 * Uploads both sizes and returns the four fields the entry document needs.
 *
 * The display image goes through `uploadBytesResumable`, whose task reports real
 * transferred bytes through a `state_changed` listener — that is how this SDK
 * version exposes progress (there is no options argument any more), so the bar
 * reflects the network rather than a timer. The thumbnail is a few kilobytes and
 * only needs one request.
 */
export async function uploadEntryImages(
  date: string,
  prepared: Prepared,
  onProgress: (percent: number) => void,
): Promise<EntryImages> {
  if (!isLive) return demoImages(prepared);

  const storage = getStorage(firebaseApp());
  const stamp = Date.now();
  const displayRef = ref(storage, `entries/${date}/${stamp}-display.${extensionFor(prepared.display)}`);
  const thumbRef = ref(storage, `entries/${date}/${stamp}-thumb.${extensionFor(prepared.thumb)}`);

  const thumbTask = uploadBytes(thumbRef, prepared.thumb, {
    contentType: prepared.thumb.type,
    cacheControl: IMMUTABLE,
  });

  const task = uploadBytesResumable(displayRef, prepared.display, {
    contentType: prepared.display.type,
    cacheControl: IMMUTABLE,
  });

  const display = await new Promise<UploadResult>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const total = snapshot.totalBytes || 1;
        onProgress(Math.min(100, Math.round((snapshot.bytesTransferred / total) * 100)));
      },
      (error) => reject(error),
      () => resolve(task.snapshot),
    );
  });

  const thumb = await thumbTask;

  return {
    imageUrl: await getDownloadURL(display.ref),
    thumbUrl: await getDownloadURL(thumb.ref),
    imagePath: display.ref.fullPath,
    thumbPath: thumb.ref.fullPath,
  };
}

/**
 * Without a Firebase project there is no bucket to write to, so the demo store
 * keeps the bytes inline. Data URLs survive the reload because the sample entries
 * live in sessionStorage; nothing about this path relaxes a rule.
 */
async function demoImages(prepared: Prepared): Promise<EntryImages> {
  const [imageUrl, thumbUrl] = await Promise.all([toDataUrl(prepared.display), toDataUrl(prepared.thumb)]);
  return { imageUrl, thumbUrl, imagePath: 'demo/display', thumbPath: 'demo/thumb' };
}

async function toDataUrl(blob: Blob): Promise<string> {
  const buffer = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buffer.length; i++) binary += String.fromCharCode(buffer[i]);
  return `data:${blob.type};base64,${btoa(binary)}`;
}

/**
 * Removes the Firestore document first, then both files.
 *
 * That order is deliberate: if the file deletes fail we are left with two
 * unreferenced objects (harmless, and a later save overwrites the same paths),
 * whereas deleting the files first would leave a readable document pointing at
 * missing images.
 */
export async function deleteEntryEverything(entry: Entry): Promise<void> {
  await deleteEntry(entry.date);
  await deleteEntryFiles(entry);
}

/** Deletes only the images; the editor calls this after a successful replace. */
export async function deleteEntryFiles(entry: Entry): Promise<void> {
  if (!isLive) return; // sample data has no Storage objects to remove

  const storage = getStorage(firebaseApp());
  const paths = [entry.imagePath, entry.thumbPath].filter(Boolean);

  await Promise.all(
    paths.map((path) => deleteObject(ref(storage, path)).catch((error: unknown) => {
      // Already gone (double delete, or cleaned up by hand) is not a failure.
      if ((error as { code?: string })?.code === 'storage/object-not-found') return;
      throw error;
    })),
  );
}
