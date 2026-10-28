/**
 * Firebase bootstrap. This module is only ever reached through a dynamic import
 * from boot, so the SDK never sits on the critical path. Storage is deliberately
 * absent here — it is imported by admin.ts, which only the editor chunk loads.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True only when a real project has been configured through .env. */
export const isLive = Boolean(config.apiKey && config.projectId && config.authDomain);

export function firebaseApp(): FirebaseApp {
  if (!isLive) {
    throw new Error('Firebase is not configured: copy .env.example to .env first.');
  }
  return getApps().length === 0 ? initializeApp(config) : getApp();
}
