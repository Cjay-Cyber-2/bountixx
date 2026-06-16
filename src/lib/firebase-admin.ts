import { initializeApp, getApps, cert, type App } from "firebase-admin/app";

/**
 * Firebase Admin is now used ONLY for sending push notifications (FCM).
 * Authentication is handled by Clerk.
 *
 * The app is initialized lazily and only when the service-account env vars are
 * present, so the project runs fine without any Firebase configuration.
 */
export function getAdminApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  const existing = getApps().find((a) => a.name === "bountixx-admin");
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    },
    "bountixx-admin"
  );
}
