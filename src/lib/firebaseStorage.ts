import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

// Initialize Firebase Storage targeting the configured storageBucket
let storageInstance: ReturnType<typeof getStorage> | null = null;
try {
  storageInstance = getStorage(app);
} catch (err) {
  console.warn('Firebase Storage initialization fallback:', err);
}

export const storage = storageInstance;

export interface UploadPhotoResult {
  downloadUrl: string;
  storagePath: string;
  isCloudStored: boolean;
  fileSizeKb: number;
  uploadedAt: string;
}

/**
 * Uploads a worker's 'Before' or 'After' service completion photo to Firebase Storage.
 * Falls back gracefully to persistent data payload if offline or if storage bucket rules restrict direct write.
 */
export async function uploadJobPhotoToFirebaseStorage(
  bookingId: string,
  category: 'before' | 'after',
  imageDataUrl: string
): Promise<UploadPhotoResult> {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString();
  const filename = `${category}_${bookingId}_${timestamp}.jpg`;
  const storagePath = `service_completions/${bookingId}/${filename}`;

  // Approximate size calculation
  const base64Length = imageDataUrl.length - (imageDataUrl.indexOf(',') + 1);
  const fileSizeKb = Math.round((base64Length * 3) / 4 / 1024);

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      // Upload base64 data URL with JPEG MIME metadata
      await uploadString(storageRef, imageDataUrl, 'data_url', {
        contentType: 'image/jpeg',
        customMetadata: {
          bookingId,
          photoType: category,
          uploadedAt: dateStr,
          app: 'ChakaChak Partner Fleet',
        },
      });

      const downloadUrl = await getDownloadURL(storageRef);
      console.info(`Successfully uploaded ${category} photo to Firebase Storage: ${storagePath}`);
      return {
        downloadUrl,
        storagePath,
        isCloudStored: true,
        fileSizeKb,
        uploadedAt: dateStr,
      };
    } catch (storageError) {
      console.warn(
        'Firebase Storage cloud upload encountered note (operating in high-res resilient fallback mode):',
        storageError
      );
      // Fallback: return dataUrl so Firestore & app context retain the captured photo without disruption
      return {
        downloadUrl: imageDataUrl,
        storagePath,
        isCloudStored: false,
        fileSizeKb,
        uploadedAt: dateStr,
      };
    }
  }

  return {
    downloadUrl: imageDataUrl,
    storagePath,
    isCloudStored: false,
    fileSizeKb,
    uploadedAt: dateStr,
  };
}
