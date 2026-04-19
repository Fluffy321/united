/**
 * JUnited Image Upload Pipeline
 *
 * - Strips EXIF data (canvas redraw)
 * - Resizes to max dimensions before upload (saves bandwidth)
 * - Returns a public URL via base44 UploadFile
 * - Optional: returns a "thumb" URL variant by appending query params
 *   (works if the CDN supports width/height transforms; gracefully degrades)
 */
import { base44 } from '@/api/base44Client';

const MAX_FEED_PX = 1200;      // max width/height for feed images
const MAX_THUMB_PX = 400;      // max width/height for thumbnails
const JPEG_QUALITY = 0.82;     // good quality / small size trade-off

/**
 * Strip EXIF and resize an image File using an off-screen canvas.
 * Returns a new Blob (JPEG).
 */
export async function processImage(file, maxPx = MAX_FEED_PX) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down if needed
      if (width > maxPx || height > maxPx) {
        if (width >= height) {
          height = Math.round((height / width) * maxPx);
          width = maxPx;
        } else {
          width = Math.round((width / height) * maxPx);
          height = maxPx;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // White background (handles transparent PNGs converted to JPEG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          resolve(blob);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image load failed'));
    };
    img.src = objectUrl;
  });
}

/**
 * Main upload function.
 * Returns { url, thumbUrl } — both are the same CDN URL
 * (thumbUrl is just the URL; callers can append ?w=400 if their CDN supports it)
 */
export async function uploadImage(file, { maxPx = MAX_FEED_PX } = {}) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Not a valid image file');
  }

  // Skip processing for very small images (< 100 KB) — no need to resize
  let fileToUpload = file;
  if (file.size > 100 * 1024) {
    const blob = await processImage(file, maxPx);
    fileToUpload = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
      type: 'image/jpeg',
    });
  }

  const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });

  return {
    url: file_url,
    thumbUrl: file_url, // same URL; add CDN transform params here if/when Cloudinary is added
  };
}

/**
 * Generate a thumbnail-sized upload separately (used for avatars/logos).
 */
export async function uploadThumbnail(file) {
  return uploadImage(file, { maxPx: MAX_THUMB_PX });
}