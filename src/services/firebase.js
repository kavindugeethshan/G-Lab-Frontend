import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { validateImageSecurity } from "../utils/fileValidation";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB2RyQ_kAzUDMVxoM0ewGaU9XG9VQDfy-8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "g-lab-8b021.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "g-lab-8b021",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "g-lab-8b021.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "242069606083",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:242069606083:web:2fb86d06544551ca1d1c76",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GKBE94E919"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export async function uploadFileToFirebase(file, folderPath = "products") {
  // Invariant security validation boundary
  const validation = await validateImageSecurity(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Security validation failed: File rejected.");
  }

  const sanitizedBase = (file.name || 'upload')
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 80);
  const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${sanitizedBase}`;
  const storageRef = ref(storage, `${folderPath}/${uniqueFilename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}
