/** Starter coin grant for new accounts and the one-time main-event gift. */
export const STARTER_COINS = 1000;

/** Entry fee per competing player when an arena goes live — funds the bounty pool. */
export const ENTRY_FEE = 100;

export const ENTRY_FEE_LABEL = `${ENTRY_FEE} coins per player`;

export const ENTRY_FEE_SUMMARY =
  `Each competing player pays ${ENTRY_FEE} coins when the arena goes live. That entry fee funds the bounty — the winner takes the full pool.`;

export const HOSTING_FREE_SUMMARY =
  "Hosting is free. You never pay to create an arena — only competitors pay the entry fee at start.";

export const MAIN_EVENT_STARTER_SUMMARY =
  `Launch bonus: every account gets ${STARTER_COINS.toLocaleString()} coins once to kick off the main event. Spend them wisely — once they're gone, they're gone.`;

/** Prize pool from competitor count (host does not pay entry). */
export function bountyPoolFromPlayers(competitorCount: number): number {
  return ENTRY_FEE * competitorCount;
}

/** Max bounty if the room fills (playerCap includes host slot). */
export function maxBountyPool(playerCap: number): number {
  return ENTRY_FEE * Math.max(0, playerCap - 1);
}

/** Stored balance for the unlimited-coins owner account. */
export const UNLIMITED_COINS_BALANCE = 9_999_999;

export const UNLIMITED_COINS_EMAIL = (
  process.env.ADMIN_EMAIL ?? "chijiokejoseph2022@gmail.com"
).toLowerCase();

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export function isUnlimitedCoinsEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === UNLIMITED_COINS_EMAIL;
}

/** Hosts referee — they never pay entry. Unlimited owner never pays entry. */
export function isEntryFeeExempt(
  userId: string,
  adminId: string,
  email: string | null | undefined,
): boolean {
  return userId === adminId || isUnlimitedCoinsEmail(email);
}

export function hasAffordableEntry(
  balance: number,
  email: string | null | undefined,
): boolean {
  return isUnlimitedCoinsEmail(email) || balance >= ENTRY_FEE;
}
