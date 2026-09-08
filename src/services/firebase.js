import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB2RyQ_kAzUDMVxoM0ewGaU9XG9VQDfy-8",
  authDomain: "g-lab-8b021.firebaseapp.com",
  projectId: "g-lab-8b021",
  storageBucket: "g-lab-8b021.firebasestorage.app",
  messagingSenderId: "242069606083",
  appId: "1:242069606083:web:2fb86d06544551ca1d1c76",
  measurementId: "G-GKBE94E919"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export async function uploadFileToFirebase(file, folderPath = "products") {
  const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const storageRef = ref(storage, `${folderPath}/${uniqueFilename}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}
