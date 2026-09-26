/**
 * Client-side image resizing and compression utility using HTML5 Canvas.
 * Optimizes doodle images before upload to keep network requests tiny and storage minimal.
 */

export interface ProcessedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const MAX_DIMENSION = 1200; // Max width or height for diary doodles (great balance of sharpness and tiny size)
const JPEG_QUALITY = 0.82;   // High visual fidelity for doodles while compressing drastically

/**
 * Validates whether a file is an acceptable image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type || 'unknown'}". Please upload a JPG, PNG, WEBP, or GIF image.`
    };
  }

  const maxRawSize = 10 * 1024 * 1024; // 10MB input limit
  if (file.size > maxRawSize) {
    return {
      valid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max raw size is 10MB.`
    };
  }

  return { valid: true };
}

/**
 * Compresses and resizes an image file in the browser using HTML5 Canvas.
 * Converts to WebP if supported, otherwise JPEG.
 */
export async function processAndCompressImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, we don't resize via canvas rasterization
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          blob: file,
          dataUrl: reader.result as string,
          width: 800,
          height: 600,
          sizeBytes: file.size,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate proportional dimensions
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Unable to get 2D canvas context'));
        return;
      }

      // Draw with smooth bicubic scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first for optimal compression, fallback to JPEG
      const mimeType = 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Fallback to JPEG
            canvas.toBlob(
              (jpegBlob) => {
                if (!jpegBlob) {
                  reject(new Error('Failed to encode compressed image'));
                  return;
                }
                const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                resolve({
                  blob: jpegBlob,
                  dataUrl,
                  width,
                  height,
                  sizeBytes: jpegBlob.size,
                });
              },
              'image/jpeg',
              JPEG_QUALITY
            );
            return;
          }

          const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
          resolve({
            blob,
            dataUrl,
            width,
            height,
            sizeBytes: blob.size,
          });
        },
        mimeType,
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for processing'));
    };

    img.src = url;
  });
}
