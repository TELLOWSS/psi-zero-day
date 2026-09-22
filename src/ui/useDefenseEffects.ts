import { useEffect, useRef, useState } from 'react';
import type { DefenseEnemyId, DefenseRunState } from '../domain/defense';

export interface DefenseResolvedEcho {
  readonly id: string;
  readonly enemyId: DefenseEnemyId;
  readonly distance: number;
}

export interface DefensePresentationDelta {
  readonly damagedEnemyIds: readonly string[];
  readonly shieldHit: boolean;
  readonly resolvedEnemyEchoes: readonly DefenseResolvedEcho[];
}

export function defensePresentationDelta(
  previous: DefenseRunState | null,
  current: DefenseRunState | null,
): DefensePresentationDelta {
  if (!previous || !current || previous.runId !== current.runId) {
    return { damagedEnemyIds: [], shieldHit: false, resolvedEnemyEchoes: [] };
  }
  const previousHp = new Map(previous.enemies.map(enemy => [enemy.id, enemy.hp]));
  const currentIds = new Set(current.enemies.map(enemy => enemy.id));
  const damagedEnemyIds = current.enemies
    .filter(enemy => {
      const hp = previousHp.get(enemy.id);
      return hp !== undefined && enemy.hp < hp;
    })
    .map(enemy => enemy.id);
  const shieldHit = current.shield < previous.shield;
  const resolvedEnemyEchoes = current.resource > previous.resource && !shieldHit
    ? previous.enemies
      .filter(enemy => !currentIds.has(enemy.id))
      .map(enemy => ({ id: enemy.id, enemyId: enemy.enemyId, distance: enemy.distance }))
    : [];
  return { damagedEnemyIds, shieldHit, resolvedEnemyEchoes };
}

export function useDefenseEffects(state: DefenseRunState | null) {
  const previousRef = useRef<DefenseRunState | null>(null);
  const impactTimerRef = useRef<number | null>(null);
  const shieldTimerRef = useRef<number | null>(null);
  const resolveTimerRef = useRef<number | null>(null);
  const [impactedEnemyIds, setImpactedEnemyIds] = useState<ReadonlySet<string>>(new Set());
  const [shieldHit, setShieldHit] = useState(false);
  const [resolvedEnemyEchoes, setResolvedEnemyEchoes] = useState<readonly DefenseResolvedEcho[]>([]);

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
    if (delta.resolvedEnemyEchoes.length) {
      setResolvedEnemyEchoes(delta.resolvedEnemyEchoes);
      if (resolveTimerRef.current !== null) window.clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = window.setTimeout(() => {
        resolveTimerRef.current = null;
        setResolvedEnemyEchoes([]);
      }, 220);
    }
  }, [state]);

  useEffect(() => () => {
    if (impactTimerRef.current !== null) window.clearTimeout(impactTimerRef.current);
    if (shieldTimerRef.current !== null) window.clearTimeout(shieldTimerRef.current);
    if (resolveTimerRef.current !== null) window.clearTimeout(resolveTimerRef.current);
  }, []);

  return { impactedEnemyIds, shieldHit, resolvedEnemyEchoes } as const;
}
