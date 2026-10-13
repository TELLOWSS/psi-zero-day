import { stagesFromSave, parseSave, safeNumber } from './survivors-save';
/**
 * PSI : ZERO DAY — Unified Triad Meta Bridge
 * 스토리(Story) · 슈팅(Patrol Survivors) · 디펜스(Zero Breach) · 현장도감(Field Guide)
 * 4위 1체 메타 진행도 및 자원 통합 브릿지
 */

export const STORAGE_KEY_FG_POINTS = 'psi.fieldguide.points';
export const STORAGE_KEY_SURVIVORS_CREDITS = 'psi.survivors.credits';
export const STORAGE_KEY_SURVIVORS_UNLOCKED = 'psi.survivors.unlocked_stages';
export const STORAGE_KEY_DEFENSE_SAVE = 'psi.defense.run.v1';

export interface UnifiedMetaState {
  readonly fgPoints: number;
  readonly survivorsCredits: number;
  readonly unlockedPatrolStages: readonly string[];
  readonly totalFieldGuideItems: number;
}

export function readFgPoints(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return Number(localStorage.getItem(STORAGE_KEY_FG_POINTS) || '0');
  } catch {
    return 0;
  }
}

export function addFgPoints(delta: number): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = readFgPoints();
    const updated = Math.max(0, current + delta);
    localStorage.setItem(STORAGE_KEY_FG_POINTS, String(updated));
    window.dispatchEvent(new CustomEvent('psi:meta-updated', { detail: { fgPoints: updated } }));
    return updated;
  } catch {
    return 0;
  }
}

export function readSurvivorsCredits(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const wallet=parseSave(localStorage.getItem('psi.survivors.store_wallet')) as {credits?:unknown}|null;
    return safeNumber(wallet&&typeof wallet.credits==='number'?wallet.credits:localStorage.getItem(STORAGE_KEY_SURVIVORS_CREDITS));
  } catch {
    return 0;
  }
}

export function readUnlockedPatrolStages(): readonly string[] {
  if (typeof window === 'undefined') return ['stage_01'];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SURVIVORS_UNLOCKED);
    return stagesFromSave(parseSave(raw),parseSave(localStorage.getItem('psi.survivors.stage_stars')));
  } catch {
    return ['stage_01'];
  }
}

export function getUnifiedMetaSnapshot(): UnifiedMetaState {
  return {
    fgPoints: readFgPoints(),
    survivorsCredits: readSurvivorsCredits(),
    unlockedPatrolStages: readUnlockedPatrolStages(),
    totalFieldGuideItems: 118,
  };
}

export function subscribeUnifiedMeta(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener('psi:meta-updated', handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('psi:meta-updated', handler);
  };
}
