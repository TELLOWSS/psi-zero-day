import { useEffect, useRef, useState } from 'react';
import type { DefenseRunState } from '../domain/defense';

export interface DefensePresentationDelta {
  readonly damagedEnemyIds: readonly string[];
  readonly shieldHit: boolean;
}

export function defensePresentationDelta(
  previous: DefenseRunState | null,
  current: DefenseRunState | null,
): DefensePresentationDelta {
  if (!previous || !current || previous.runId !== current.runId) {
    return { damagedEnemyIds: [], shieldHit: false };
  }
  const previousHp = new Map(previous.enemies.map(enemy => [enemy.id, enemy.hp]));
  const damagedEnemyIds = current.enemies
    .filter(enemy => {
      const hp = previousHp.get(enemy.id);
      return hp !== undefined && enemy.hp < hp;
    })
    .map(enemy => enemy.id);
  return {
    damagedEnemyIds,
    shieldHit: current.shield < previous.shield,
  };
}

export function useDefenseEffects(state: DefenseRunState | null) {
  const previousRef = useRef<DefenseRunState | null>(null);
  const impactTimerRef = useRef<number | null>(null);
  const shieldTimerRef = useRef<number | null>(null);
  const [impactedEnemyIds, setImpactedEnemyIds] = useState<ReadonlySet<string>>(new Set());
  const [shieldHit, setShieldHit] = useState(false);

  useEffect(() => {
    const delta = defensePresentationDelta(previousRef.current, state);
    previousRef.current = state;
    if (delta.damagedEnemyIds.length) {
      setImpactedEnemyIds(new Set(delta.damagedEnemyIds));
      if (impactTimerRef.current !== null) window.clearTimeout(impactTimerRef.current);
      impactTimerRef.current = window.setTimeout(() => {
        impactTimerRef.current = null;
        setImpactedEnemyIds(new Set());
      }, 140);
    }
    if (delta.shieldHit) {
      setShieldHit(true);
      if (shieldTimerRef.current !== null) window.clearTimeout(shieldTimerRef.current);
      shieldTimerRef.current = window.setTimeout(() => {
        shieldTimerRef.current = null;
        setShieldHit(false);
      }, 180);
    }
  }, [state]);

  useEffect(() => () => {
    if (impactTimerRef.current !== null) window.clearTimeout(impactTimerRef.current);
    if (shieldTimerRef.current !== null) window.clearTimeout(shieldTimerRef.current);
  }, []);

  return { impactedEnemyIds, shieldHit } as const;
}
