function credits(value: number): number {
  return Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : 0;
}

/** Session earnings already transferred to the wallet must not be paid twice. */
export function settlePatrolCredits(wallet: number, earned: number, transferred: number): number {
  return credits(credits(wallet) + Math.max(0, credits(earned) - credits(transferred)));
}
