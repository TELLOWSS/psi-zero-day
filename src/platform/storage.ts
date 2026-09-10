import type { Id } from '../domain';

/** Offline storage contract. Bytes/text must be validated by persistence before use. */
export interface StoragePort {
  read(key: Id): Promise<string | null>;
  /** Adapter must replace atomically; rejection must preserve the last committed value. */
  write(key: Id, serialized: string): Promise<void>;
  remove(key: Id): Promise<void>;
  keys(): Promise<readonly Id[]>;
}

// IndexedDB and Android filesystem adapters are deliberately not implemented in TASK-001.
