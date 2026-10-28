/**
 * The browser-side image pipeline.
 *
 * A phone camera hands us a 9 MB JPEG; the diary needs a 150 KB display image and
 * a 128 px thumbnail that costs under 8 KB. Everything is resized on a canvas
 * before the upload starts, so nobody's data plan pays for the original and the
 * Storage rules (which cap an upload at 1 MB) never have to be loosened.
 */

/** Anything larger is rejected before decoding: a raw camera file, a video frame. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/** storage.rules refuses anything over 1 MB; we stay comfortably inside it. */
export const MAX_UPLOAD_BYTES = 1024 * 1024;

export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** The longest edge of the image a reader sees, in CSS pixels. */
export const DISPLAY_LONG_EDGE = 800;

/** Square cover-crop thumbnail: 64 px on the desktop at 2x, and tiny on the wire. */
export const THUMB_EDGE = 128;

/** Aim for the display image at or under this; the quality ladder trades down to it. */
export const DISPLAY_TARGET_BYTES = 150 * 1024;

export interface Prepared {
  display: Blob;
  thumb: Blob;
}

interface Drawable {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?(): void;
}

/** Returns a message to show the user, or null when the file is acceptable. */
export function validateSource(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `That file type (${file.type || 'unknown'}) is not supported. Use PNG, JPEG, WebP or GIF.`;
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return `That image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Please pick one under 15 MB.`;
  }
  return null;
}

/** Decodes, resizes and encodes both sizes. Throws a readable Error on bad input. */
export async function prepare(file: File): Promise<Prepared> {
  const problem = validateSource(file);
  if (problem) throw new Error(problem);

  const drawable = await toDrawable(file);

  try {
    const display = await render(drawable, ...fit(drawable.width, drawable.height, DISPLAY_LONG_EDGE), false);
    const thumb = await render(drawable, THUMB_EDGE, THUMB_EDGE, true);

    if (display.size > MAX_UPLOAD_BYTES || thumb.size > MAX_UPLOAD_BYTES) {
      throw new Error('The image could not be compressed enough to upload. Try a smaller picture.');
    }

    return { display, thumb };
  } finally {
    drawable.release?.();
  }
}

/** Downscales to fit `edge` on the longest side; never upscales. */
function fit(width: number, height: number, edge: number): [number, number] {
  const scale = Math.min(1, edge / Math.max(width, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}

async function toDrawable(file: File): Promise<Drawable> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Honour the camera's orientation tag instead of uploading a sideways photo.
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Older Safari and WebKit builds reject the options bag; fall through.
      try {
        const bitmap = await createImageBitmap(file);
        return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
      } catch {
        /* Not decodable as a bitmap: the object-URL path gives a better error. */
      }
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => image.remove() };
  } catch {
    throw new Error('That file could not be read as an image.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Draws into a canvas at the requested size; `squareCrop` centres a cover crop. */
async function render(drawable: Drawable, width: number, height: number, squareCrop: boolean): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize images. Try a smaller picture.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (squareCrop) {
    const side = Math.min(drawable.width, drawable.height);
    context.drawImage(
      drawable.source,
      (drawable.width - side) / 2,
      (drawable.height - side) / 2,
      side,
      side,
      0,
      0,
      width,
      height,
    );
  } else {
    context.drawImage(drawable.source, 0, 0, width, height);
  }

  return encode(canvas);
}

/**
 * WebP first — it is the smallest for the same quality. If the browser cannot
 * encode it (it answers with a PNG under the same requested name), fall back to
 * JPEG, then walk the quality down until the file fits the budget.
 */
async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await toBlob(canvas, 'image/webp', 0.8);
  const canEncodeWebp = webp !== null && webp.type === 'image/webp';

  const type = canEncodeWebp ? 'image/webp' : 'image/jpeg';
  const ladder = canEncodeWebp ? [0.8, 0.68, 0.55] : [0.85, 0.7, 0.55];

  let best = canEncodeWebp ? webp : await toBlob(canvas, type, ladder[0]);

  for (const quality of ladder.slice(1)) {
    if (!best || best.size <= DISPLAY_TARGET_BYTES) break;
    best = await toBlob(canvas, type, quality);
  }

  if (!best) throw new Error('The image could not be encoded for upload.');
  return best;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** File extension that matches an encoded blob's type, used to name Storage objects. */
export function extensionFor(blob: Blob): string {
  if (blob.type.includes('webp')) return 'webp';
  if (blob.type.includes('png')) return 'png';
  return 'jpg';
}
