import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

if (import.meta.env.PROD) {
  console.log('Firebase Init Debug:', {
    keyPrefix: firebaseConfig.apiKey?.substring(0, 10),
    keySuffix: firebaseConfig.apiKey?.substring(firebaseConfig.apiKey.length - 5),
    keyLength: firebaseConfig.apiKey?.length,
    projectId: firebaseConfig.projectId
  });
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

// Enable persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistence failed: multiple tabs open');
  } else if (err.code === 'unimplemented-') {
    console.warn('Persistence is not supported by this browser');
  }
});
