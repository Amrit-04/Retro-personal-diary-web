import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isConfigured } from '../firebase';
import { processAndCompressImage, validateImageFile } from '../utils/image';

// In-memory mock storage for demo / unconfigured mode
const mockStorageMap = new Map<string, string>();

/**
 * Uploads an image file to Firebase Storage under doodles/ folder.
 * Compresses the image on the client first.
 * Returns the download URL and the storage path.
 */
export async function uploadDoodleImage(
  file: File,
  date: string,
  onProgress?: (progressPercent: number) => void
): Promise<{ imageUrl: string; imagePath: string }> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file');
  }

  if (onProgress) onProgress(20);

  // Compress and resize
  const processed = await processAndCompressImage(file);

  if (onProgress) onProgress(60);

  const extension = processed.blob.type === 'image/webp' ? 'webp' : 'jpg';
  const timestamp = Date.now();
  const imagePath = `doodles/${date}_${timestamp}.${extension}`;

  if (!isConfigured) {
    // Demo mode: save dataUrl into memory
    mockStorageMap.set(imagePath, processed.dataUrl);
    if (onProgress) onProgress(100);
    return {
      imageUrl: processed.dataUrl,
      imagePath,
    };
  }

  const storageRef = ref(storage, imagePath);
  const metadata = {
    contentType: processed.blob.type,
    customMetadata: {
      date,
      originalName: file.name,
    },
  };

  await uploadBytes(storageRef, processed.blob, metadata);
  if (onProgress) onProgress(90);

  const imageUrl = await getDownloadURL(storageRef);
  if (onProgress) onProgress(100);

  return { imageUrl, imagePath };
}

/**
 * Deletes an image from Firebase Storage if it exists.
 */
export async function deleteDoodleImage(imagePath: string): Promise<void> {
  if (!imagePath) return;

  if (!isConfigured) {
    mockStorageMap.delete(imagePath);
    return;
  }

  try {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If object doesn't exist (e.g. already deleted), ignore error
    if (error.code !== 'storage/object-not-found') {
      console.warn('Failed to delete image from storage:', error);
    }
  }
}
