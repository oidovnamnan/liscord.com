import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuaNXsfhQt_dtNgoBs_Uz6IXN8qzZkONs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "liscord-2b529.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "liscord-2b529",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "liscord-2b529.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "190310416937",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:190310416937:web:824037b0a18abcdaabd238",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
});
export const storage = getStorage(app);
export const messaging = getMessaging(app);

