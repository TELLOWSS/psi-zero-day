export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;

/** Reject values JSON would silently lose or transform. No platform dependency. */
export function assertData(value: unknown, ancestors = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || value === null) throw new Error('Non-serializable state data');
  if (ancestors.has(value)) throw new Error('Cyclic state data');
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new Error('State must contain plain data only');
  }
  if (Object.getOwnPropertySymbols(value).length) throw new Error('Symbol state keys are not supported');
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!('value' in descriptor)) throw new Error('State accessors are not supported');
    assertData(descriptor.value, ancestors);
  }
  if (Array.isArray(value) && Object.keys(value).length !== value.length) throw new Error('Sparse arrays are not supported');
  ancestors.delete(value);
}
export function copyData<T>(value: T): Mutable<T> {
  assertData(value);
  return JSON.parse(JSON.stringify(value)) as Mutable<T>;
}
export function freezeData<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freezeData);
    Object.freeze(value);
  }
  return value;
}
export function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Expected finite number');
  return value;
}
export function add(value: number | undefined, delta: number): number {
  if (value === undefined) throw new Error('Missing numeric state field');
  return finite(finite(value) + finite(delta));
}
export function own<T>(record: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}
