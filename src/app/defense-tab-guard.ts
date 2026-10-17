import { DEFENSE_SAVE_KEY } from './defense-save';

export const DEFENSE_TAB_LOCK_NAME = 'psi-zero-day:defense:active';
export const DEFENSE_TAB_LEASE_KEY = 'psi-zero-day.defense.tab-lease.v1';
// Training and GUARD campaign deliberately persist to independent save keys.
// They must also own independent tab locks, otherwise the asynchronous Web Locks
// release on a legitimate in-tab mode switch can block the next screen.
// Multiple tabs editing the SAME save key still contend for the same lock.
export function defenseTabLockName(saveKey = DEFENSE_SAVE_KEY): string {
  return saveKey === DEFENSE_SAVE_KEY ? DEFENSE_TAB_LOCK_NAME : `${DEFENSE_TAB_LOCK_NAME}:${saveKey}`;
}
export function defenseTabLeaseKey(saveKey = DEFENSE_SAVE_KEY): string {
  return saveKey === DEFENSE_SAVE_KEY ? DEFENSE_TAB_LEASE_KEY : `${DEFENSE_TAB_LEASE_KEY}:${saveKey}`;
}
const LEASE_TTL_MS = 15_000;
const LEASE_HEARTBEAT_MS = 5_000;

interface LockLike {}
interface LockManagerLike {
  request(
    name: string,
    options: { readonly mode: 'exclusive'; readonly ifAvailable: true },
    callback: (lock: LockLike | null) => Promise<void> | void,
  ): Promise<void>;
}

export interface DefenseTabGuard {
  readonly status: 'active' | 'blocked';
  readonly source: 'web-locks' | 'storage-lease';
  release(): void;
}

function ownerId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return random ?? `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function storageLease(storage: Storage, now = Date.now(), leaseKey = DEFENSE_TAB_LEASE_KEY): { readonly ownerId: string; readonly expiresAt: number } | null {
  try {
    const raw = storage.getItem(leaseKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const value = parsed as Record<string, unknown>;
    if (typeof value.ownerId !== 'string' || typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return null;
    if (value.expiresAt <= now) return null;
    return { ownerId: value.ownerId, expiresAt: value.expiresAt };
  } catch {
    return null;
  }
}

function writeLease(storage: Storage, id: string, now = Date.now(), leaseKey = DEFENSE_TAB_LEASE_KEY): boolean {
  try {
    storage.setItem(leaseKey, JSON.stringify({ ownerId: id, expiresAt: now + LEASE_TTL_MS }));
    return storageLease(storage, now, leaseKey)?.ownerId === id;
  } catch {
    return false;
  }
}

export async function acquireDefenseTabGuard(
  onExternalSave: () => void,
  onLockLost: () => void,
  watchedSaveKey=DEFENSE_SAVE_KEY,
): Promise<DefenseTabGuard> {
  const id = ownerId();
  const lockName = defenseTabLockName(watchedSaveKey);
  const leaseKey = defenseTabLeaseKey(watchedSaveKey);
  const lockManager = (navigator as Navigator & { readonly locks?: LockManagerLike }).locks;
  if (lockManager) {
    let releaseHold: (() => void) | null = null;
    let resolved = false;
    const acquired = new Promise<boolean>(resolve => {
      void lockManager.request(lockName, { mode: 'exclusive', ifAvailable: true }, async lock => {
        resolved = true;
        if (!lock) {
          resolve(false);
          return;
        }
        resolve(true);
        await new Promise<void>(release => { releaseHold = release; });
      }).catch(() => {
        if (!resolved) resolve(false);
      });
    });
    const ok = await acquired;
    if (ok) {
      const onStorage = (event: StorageEvent) => {
        if (event.key === watchedSaveKey) onExternalSave();
      };
      window.addEventListener('storage', onStorage);
      return {
        status: 'active',
        source: 'web-locks',
        release() {
          window.removeEventListener('storage', onStorage);
          releaseHold?.();
          releaseHold = null;
        },
      };
    }
    return { status: 'blocked', source: 'web-locks', release() {} };
  }

  let storage: Storage;
  try {
    storage = window.localStorage;
  } catch {
    return { status: 'blocked', source: 'storage-lease', release() {} };
  }

  const existing = storageLease(storage, Date.now(), leaseKey);
  if (existing && existing.ownerId !== id) {
    return { status: 'blocked', source: 'storage-lease', release() {} };
  }
  if (!writeLease(storage, id, Date.now(), leaseKey)) {
    return { status: 'blocked', source: 'storage-lease', release() {} };
  }

  const heartbeat = window.setInterval(() => {
    const current = storageLease(storage, Date.now(), leaseKey);
    if (current && current.ownerId !== id) {
      onLockLost();
      return;
    }
    if (!writeLease(storage, id, Date.now(), leaseKey)) onLockLost();
  }, LEASE_HEARTBEAT_MS);

  const onStorage = (event: StorageEvent) => {
    if (event.key === watchedSaveKey) onExternalSave();
    if (event.key === leaseKey) {
      const current = storageLease(storage);
      if (current && current.ownerId !== id) onLockLost();
    }
  };
  window.addEventListener('storage', onStorage);

  return {
    status: 'active',
    source: 'storage-lease',
    release() {
      window.clearInterval(heartbeat);
      window.removeEventListener('storage', onStorage);
      try {
        if (storageLease(storage, Date.now(), leaseKey)?.ownerId === id) storage.removeItem(leaseKey);
      } catch { /* storage unavailable during teardown */ }
    },
  };
}
