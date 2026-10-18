import {describe,it,expect} from 'vitest';
import {DEFENSE_SAVE_KEY} from '../src/app/defense-save';
import {GUARD_SAVE_KEY} from '../src/app/guard-storage';
import {
  DEFENSE_TAB_LOCK_NAME,DEFENSE_TAB_LEASE_KEY,
  defenseTabLockName,defenseTabLeaseKey,
} from '../src/app/defense-tab-guard';

describe('independent defense save tab locks',()=>{
  it('preserves the legacy training lock and lease contract',()=>{
    expect(defenseTabLockName()).toBe(DEFENSE_TAB_LOCK_NAME);
    expect(defenseTabLockName(DEFENSE_SAVE_KEY)).toBe(DEFENSE_TAB_LOCK_NAME);
    expect(defenseTabLeaseKey()).toBe(DEFENSE_TAB_LEASE_KEY);
    expect(defenseTabLeaseKey(DEFENSE_SAVE_KEY)).toBe(DEFENSE_TAB_LEASE_KEY);
  });
  it('isolates GUARD campaign from training while retaining same-save exclusivity',()=>{
    expect(GUARD_SAVE_KEY).not.toBe(DEFENSE_SAVE_KEY);
    expect(defenseTabLockName(GUARD_SAVE_KEY)).not.toBe(defenseTabLockName(DEFENSE_SAVE_KEY));
    expect(defenseTabLeaseKey(GUARD_SAVE_KEY)).not.toBe(defenseTabLeaseKey(DEFENSE_SAVE_KEY));
    expect(defenseTabLockName(GUARD_SAVE_KEY)).toBe(defenseTabLockName(GUARD_SAVE_KEY));
    expect(defenseTabLeaseKey(GUARD_SAVE_KEY)).toBe(defenseTabLeaseKey(GUARD_SAVE_KEY));
  });
});
