import { getAdminApp } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { db } from "@/lib/db";
import { pushTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const adminApp = getAdminApp();
  if (!adminApp) return; // Push notifications not configured — silently skip.

  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));

  if (tokens.length === 0) return;

  const messaging = getMessaging(adminApp);

  const messages = tokens.map((t) => ({
    notification: { title, body },
    data: data ?? {},
    token: t.token,
  }));

  try {
    await messaging.sendEach(messages);
  } catch (err) {
    console.error("[FCM] send failed:", err);
  }
}
