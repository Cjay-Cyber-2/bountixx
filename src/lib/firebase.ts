import { initializeApp, getApps, type FirebaseApp } from "firebase/app";

/**
 * Firebase is now used ONLY for optional push notifications (FCM).
 * Authentication and avatars are handled by Clerk.
 *
 * If the Firebase env vars are not provided, `app` is null and the push
 * notification feature simply stays disabled — the rest of the app works fine.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.messagingSenderId && firebaseConfig.appId
);

export const app: FirebaseApp | null = firebaseEnabled
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]
  : null;
