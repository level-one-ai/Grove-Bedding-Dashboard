import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Configure via .env — copy .env.example to .env and fill in your Firebase project credentials.
// VITE_FIREBASE_PROJECT_ID is the minimum required to enable live Firestore.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '',
};

/** True when the app has a real Firebase project configured. */
export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Re-export all Firestore helpers so callers don't need a second import.
export {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
};
