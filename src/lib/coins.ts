/** Welcome bonus for new accounts and anyone still at 0 balance. */
export const STARTER_COINS = 500;

/** Entry fee per competing player when an arena goes live. */
export const ENTRY_FEE = 50;

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
