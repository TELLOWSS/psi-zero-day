import type { Id } from '../domain';
import type { StoragePort } from './storage';

/** Browser adapter for the existing atomic single-key StoragePort contract. */
export class BrowserLocalStoragePort implements StoragePort {
  constructor(private readonly storage: Storage) {}

  async read(key: Id): Promise<string | null> {
    return this.storage.getItem(key);
  }

  async write(key: Id, serialized: string): Promise<void> {
    this.storage.setItem(key, serialized);
  }

  async remove(key: Id): Promise<void> {
    this.storage.removeItem(key);
  }

  async keys(): Promise<readonly Id[]> {
    return Array.from({ length: this.storage.length }, (_, index) => this.storage.key(index))
      .filter((key): key is string => key !== null);
  }
}

export function browserLocalStoragePort(): BrowserLocalStoragePort {
  return new BrowserLocalStoragePort(window.localStorage);
}
