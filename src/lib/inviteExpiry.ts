import { db } from "@/lib/db";
import { invites } from "@/lib/schema";
import { and, eq, lt } from "drizzle-orm";
import { INVITE_TTL_MS } from "@/lib/roomExpiry";

export { INVITE_TTL_MS };

export function isInviteExpired(createdAt: Date | string | null | undefined): boolean {
  if (!createdAt) return true;
  return Date.now() - new Date(createdAt).getTime() >= INVITE_TTL_MS;
}

export function inviteExpiresAt(createdAt: Date | string): Date {
  return new Date(new Date(createdAt).getTime() + INVITE_TTL_MS);
}

export function inviteMinutesLeft(createdAt: Date | string): number {
  const msLeft = inviteExpiresAt(createdAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / 60_000));
}

/** Mark pending invites past TTL as declined so they stop surfacing. */
export async function expireStalePendingInvites(inviteeId?: string): Promise<void> {
  const cutoff = new Date(Date.now() - INVITE_TTL_MS);
  const conditions = [eq(invites.status, "pending"), lt(invites.createdAt, cutoff)];
  if (inviteeId) {
    conditions.push(eq(invites.inviteeId, inviteeId));
  }

  await db
    .update(invites)
    .set({ status: "declined" })
    .where(and(...conditions));
}
