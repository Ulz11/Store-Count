import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { requireStorage } from '@/lib/firebase';

interface UploadResult {
  photoUrl: string;
  thumbUrl: string;
}

/**
 * Compress a photo and upload to Firebase Storage.
 * The Firebase "Resize Images" extension auto-generates a 200px thumbnail at
 * a path like `items/{itemId}/photo_200x200.jpeg`. We just predict that path
 * and let the extension fill it. If you don't install the extension, the
 * thumbnail URL will 404 until you do — handled gracefully by `<img onerror>`.
 */
export async function uploadItemPhoto(itemId: string, file: File): Promise<UploadResult> {
  const storage = requireStorage();

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.75,
  });

  const photoRef = ref(storage, `items/${itemId}/photo.jpg`);
  await uploadBytes(photoRef, compressed, {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  });
  const photoUrl = await getDownloadURL(photoRef);

  // Predict the thumbnail path that the Resize Images extension will create.
  // If extension isn't installed, this URL won't resolve — that's OK; UI falls back.
  let thumbUrl = photoUrl;
  try {
    const thumbRef = ref(storage, `items/${itemId}/photo_200x200.jpeg`);
    thumbUrl = await getDownloadURL(thumbRef);
  } catch {
    // Extension not installed or thumb not generated yet — use full image
    thumbUrl = photoUrl;
  }

  return { photoUrl, thumbUrl };
}
