import { DEFENSE_SAVE_KEY } from './defense-save';

export const DEFENSE_TAB_LOCK_NAME = 'psi-zero-day:defense:active';
export const DEFENSE_TAB_LEASE_KEY = 'psi-zero-day.defense.tab-lease.v1';
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

function storageLease(storage: Storage, id: string, now = Date.now()): { readonly ownerId: string; readonly expiresAt: number } | null {
  try {
    const raw = storage.getItem(DEFENSE_TAB_LEASE_KEY);
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

function writeLease(storage: Storage, id: string, now = Date.now()): boolean {
  try {
    storage.setItem(DEFENSE_TAB_LEASE_KEY, JSON.stringify({ ownerId: id, expiresAt: now + LEASE_TTL_MS }));
    return storageLease(storage, id, now)?.ownerId === id;
  } catch {
    return false;
  }
}

export async function acquireDefenseTabGuard(
  onExternalSave: () => void,
  onLockLost: () => void,
): Promise<DefenseTabGuard> {
  const id = ownerId();
  const lockManager = (navigator as Navigator & { readonly locks?: LockManagerLike }).locks;
  if (lockManager) {
    let releaseHold: (() => void) | null = null;
    let resolved = false;
    const acquired = new Promise<boolean>(resolve => {
      void lockManager.request(DEFENSE_TAB_LOCK_NAME, { mode: 'exclusive', ifAvailable: true }, async lock => {
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
        if (event.key === DEFENSE_SAVE_KEY) onExternalSave();
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

  const existing = storageLease(storage, id);
  if (existing && existing.ownerId !== id) {
    return { status: 'blocked', source: 'storage-lease', release() {} };
  }
  if (!writeLease(storage, id)) {
    return { status: 'blocked', source: 'storage-lease', release() {} };
  }

  const heartbeat = window.setInterval(() => {
    const current = storageLease(storage, id);
    if (current && current.ownerId !== id) {
      onLockLost();
      return;
    }
    if (!writeLease(storage, id)) onLockLost();
  }, LEASE_HEARTBEAT_MS);

  const onStorage = (event: StorageEvent) => {
    if (event.key === DEFENSE_SAVE_KEY) onExternalSave();
    if (event.key === DEFENSE_TAB_LEASE_KEY) {
      const current = storageLease(storage, id);
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
        if (storageLease(storage, id)?.ownerId === id) storage.removeItem(DEFENSE_TAB_LEASE_KEY);
      } catch { /* storage unavailable during teardown */ }
    },
  };
}
