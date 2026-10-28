/**
 * Admin-only file work: deleting the Storage objects that belong to an entry.
 *
 * This is the only module that imports firebase/storage, and it is reached only
 * through a dynamic import from an admin action. A reader — signed in or not —
 * never downloads the Storage SDK. Uploads land here too, from the editor chunk.
 */
import { deleteObject, getStorage, ref } from 'firebase/storage';
import { firebaseApp, isLive } from './app';
import { deleteEntry, type Entry } from './entries';

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
