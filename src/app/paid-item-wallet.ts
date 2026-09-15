import type { EpisodeSaveStorage } from './episode-save';

export const PAID_ITEM_WALLET_KEY = 'psi-zero-day.paid-item-wallet.v1';
export const REPLAN_PASS_ITEM_ID = 'action.replan_pass' as const;

export interface PaidItemWallet {
  readonly schema_version: 1;
  readonly quantities: Readonly<Record<string, number>>;
}

const EMPTY_WALLET: PaidItemWallet = Object.freeze({
  schema_version: 1,
  quantities: Object.freeze({}),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeQuantities(value: unknown): Readonly<Record<string, number>> | null {
  if (!isRecord(value)) return null;
  const entries: [string, number][] = [];
  for (const [itemId, raw] of Object.entries(value)) {
    if (!itemId || typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) return null;
    if (raw > 0) entries.push([itemId, raw]);
  }
  return Object.freeze(Object.fromEntries(entries));
}

export function emptyPaidItemWallet(): PaidItemWallet {
  return EMPTY_WALLET;
}

export function decodePaidItemWallet(raw: string | null): PaidItemWallet {
  if (!raw) return EMPTY_WALLET;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schema_version !== 1) return EMPTY_WALLET;
    const quantities = normalizeQuantities(parsed.quantities);
    return quantities ? Object.freeze({ schema_version: 1, quantities }) : EMPTY_WALLET;
  } catch {
    return EMPTY_WALLET;
  }
}

export function loadPaidItemWallet(storage: EpisodeSaveStorage): PaidItemWallet {
  try { return decodePaidItemWallet(storage.getItem(PAID_ITEM_WALLET_KEY)); }
  catch { return EMPTY_WALLET; }
}

export function savePaidItemWallet(storage: EpisodeSaveStorage, wallet: PaidItemWallet): boolean {
  try {
    storage.setItem(PAID_ITEM_WALLET_KEY, JSON.stringify(wallet));
    return true;
  } catch {
    return false;
  }
}

export function paidItemQuantity(wallet: PaidItemWallet, itemId: string): number {
  return wallet.quantities[itemId] ?? 0;
}

/**
 * Entitlement bridge only. Store/IAP integration may call this after a verified grant.
 * No price, balance formula or random reward is defined here.
 */
export function creditPaidItem(wallet: PaidItemWallet, itemId: string, quantity: number): PaidItemWallet {
  if (!itemId || !Number.isInteger(quantity) || quantity <= 0) return wallet;
  const next = { ...wallet.quantities, [itemId]: paidItemQuantity(wallet, itemId) + quantity };
  return Object.freeze({ schema_version: 1, quantities: Object.freeze(next) });
}

/** Returns the same wallet when the item is unavailable; quantities never go negative. */
export function consumePaidItem(wallet: PaidItemWallet, itemId: string): PaidItemWallet {
  const current = paidItemQuantity(wallet, itemId);
  if (current <= 0) return wallet;
  const next = { ...wallet.quantities };
  if (current === 1) delete next[itemId];
  else next[itemId] = current - 1;
  return Object.freeze({ schema_version: 1, quantities: Object.freeze(next) });
}
