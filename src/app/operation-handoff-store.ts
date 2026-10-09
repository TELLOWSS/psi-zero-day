import type {OperationHandoff} from '../domain/survivors-operation-handoff';
import {isOperationHandoff} from '../domain/operation-handoff-validation';
export const OPERATION_HANDOFF_KEY = 'psi.survivors.operation-handoff.v1';
type HandoffStorage = Pick<Storage, 'getItem' | 'setItem'>;
function defaultStorage(): HandoffStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}
export function readOperationHandoffs(storage = defaultStorage()): OperationHandoff[] {
  try {
    const data: unknown = JSON.parse(storage?.getItem(OPERATION_HANDOFF_KEY) ?? '[]');
    return Array.isArray(data) ? data.filter(isOperationHandoff).slice(-50) : [];
  } catch { return []; }
}
export function saveOperationHandoff(record: OperationHandoff, storage = defaultStorage()): boolean {
  if (!storage || !isOperationHandoff(record)) return false;
  try {
    const rows = readOperationHandoffs(storage).filter(r => r.characterId !== record.characterId || r.stageId !== record.stageId);
    storage.setItem(OPERATION_HANDOFF_KEY, JSON.stringify([...rows, record].slice(-50)));
    return true;
  } catch { return false; }
}
