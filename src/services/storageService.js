import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload an image file to Firebase Storage under 'products/'
 */
export const uploadProductImage = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided for upload"));
      return;
    }

    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `products/${timestamp}_${sanitizedName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error("Firebase Storage Upload Error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err) {
            console.error("Error retrieving download URL:", err);
            reject(err);
          }
        }
      );
    } catch (err) {
      console.error("Storage initialization error:", err);
      reject(err);
    }
  });
};
