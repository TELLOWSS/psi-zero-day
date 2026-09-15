import { describe, expect, it } from 'vitest';
import {
  consumePaidItem,
  creditPaidItem,
  decodePaidItemWallet,
  emptyPaidItemWallet,
  loadPaidItemWallet,
  paidItemQuantity,
  PAID_ITEM_WALLET_KEY,
  REPLAN_PASS_ITEM_ID,
  savePaidItemWallet,
} from '../src/app/paid-item-wallet';
import type { EpisodeSaveStorage } from '../src/app/episode-save';

class MemoryStorage implements EpisodeSaveStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

describe('paid item wallet', () => {
  it('starts empty and never invents paid inventory', () => {
    const wallet = emptyPaidItemWallet();
    expect(paidItemQuantity(wallet, REPLAN_PASS_ITEM_ID)).toBe(0);
    expect(consumePaidItem(wallet, REPLAN_PASS_ITEM_ID)).toBe(wallet);
  });

  it('credits verified entitlement quantities and consumes exactly one use', () => {
    const granted = creditPaidItem(emptyPaidItemWallet(), REPLAN_PASS_ITEM_ID, 2);
    expect(paidItemQuantity(granted, REPLAN_PASS_ITEM_ID)).toBe(2);
    const usedOnce = consumePaidItem(granted, REPLAN_PASS_ITEM_ID);
    expect(paidItemQuantity(usedOnce, REPLAN_PASS_ITEM_ID)).toBe(1);
    const usedTwice = consumePaidItem(usedOnce, REPLAN_PASS_ITEM_ID);
    expect(paidItemQuantity(usedTwice, REPLAN_PASS_ITEM_ID)).toBe(0);
    expect(consumePaidItem(usedTwice, REPLAN_PASS_ITEM_ID)).toBe(usedTwice);
  });

  it('persists separately from the episode GameState save and rejects corrupt quantities', () => {
    const storage = new MemoryStorage();
    const wallet = creditPaidItem(emptyPaidItemWallet(), REPLAN_PASS_ITEM_ID, 1);
    expect(savePaidItemWallet(storage, wallet)).toBe(true);
    expect(storage.values.has(PAID_ITEM_WALLET_KEY)).toBe(true);
    expect(loadPaidItemWallet(storage)).toEqual(wallet);
    expect(decodePaidItemWallet('{"schema_version":1,"quantities":{"action.replan_pass":-1}}'))
      .toEqual(emptyPaidItemWallet());
  });
});
