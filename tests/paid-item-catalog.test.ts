import { describe, expect, it } from 'vitest';
import catalog from '../content/product/paid-item-catalog.json';

describe('paid item catalog foundation', () => {
  it('keeps pricing intentionally unapproved', () => {
    expect(catalog.status).toBe('balance_pending');
    expect(catalog.pricing).toBeNull();
  });

  it('uses only action, facility and equipment categories', () => {
    const categories = new Set(catalog.items.map(item => item.category));
    expect([...categories].sort()).toEqual(['action', 'equipment', 'facility']);
  });

  it('never lets money erase an incident or directly buy PSI', () => {
    for (const item of catalog.items) {
      expect(item.may_erase_occurred_incident).toBe(false);
      expect(item.may_buy_psi_score).toBe(false);
    }
  });

  it('keeps the internal 까방권 nickname on the replan item only', () => {
    const replan = catalog.items.find(item => item.item_id === 'action.replan_pass');
    expect(replan?.internal_nickname).toBe('까방권');
  });
});
