import { useEffect, useMemo, useRef, useState } from 'react';
import type { DefenseContent, DefensePoint, DefenseRunState } from '../domain/defense';
import { defensePositionAtDistance } from '../engine/defense';
import { defenseMapFrame, defenseMapPointPercent } from '../app/defense-map-framing';
import { defenseVisualPadPoint, defenseVisualPositionAtDistance } from '../app/defense-visual-projection';

export type DefenseCameraMode =
  | 'STRATEGIC_BASE'
  | 'THREAT_APPROACH'
  | 'IMPACT_CLOSE_UP'
  | 'RETURN_RECOVER';

export interface DefenseCameraSignal {
  readonly kind: 'NONE' | 'APPROACH' | 'IMPACT';
  readonly enemyId: string | null;
  readonly focus: DefensePoint | null;
  readonly reason: string | null;
}

export interface DefenseCameraPresentation {
  readonly mode: DefenseCameraMode;
  readonly scale: number;
  readonly manualScale: number;
  readonly focus: {
    readonly left: number;
    readonly top: number;
  };
  readonly focusEnemyId: string | null;
  readonly reason: string | null;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly resetZoom: () => void;
}

function activeSlowSources(enemy: DefenseRunState['enemies'][number], tick: number): ReadonlySet<string> {
  return new Set(
    enemy.slowEffects
      .filter(effect => effect.startTick <= tick && tick < effect.endTick)
      .map(effect => `${effect.sourceId}:${effect.startTick}`),
  );
}

function isEnemyRevealed(enemy: DefenseRunState['enemies'][number], state: DefenseRunState): boolean {
  return enemy.revealUntilTick > state.tick || state.revealAllUntilTick > state.tick;
}

function controlThreat(
  state: DefenseRunState,
  content: DefenseContent,
): { readonly enemyId: string; readonly focus: DefensePoint; readonly score: number } | null {
  const controls = state.towers
    .filter(tower => tower.towerId === 'CONTROL')
    .map(tower => {
      const pad = content.map.pads.find(item => item.id === tower.padId);
      const level = content.towers
        .find(item => item.id === 'CONTROL')
        ?.levels.find(item => item.id === tower.levelId);
      return pad && level ? { pad, visualPad: defenseVisualPadPoint(content.map.id, pad), range: level.range } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (!controls.length) return null;

  let best: { enemyId: string; focus: DefensePoint; score: number } | null = null;
  for (const enemy of state.enemies) {
    if (enemy.enemyId !== 'SWIFT' && enemy.enemyId !== 'VEILED') continue;
    const pos = defensePositionAtDistance(content.map.path, enemy.distance);
    const visualPos = defenseVisualPositionAtDistance(content.map.id, content.map.path, enemy.distance);
    for (const control of controls) {
      const dx = pos.x - control.pad.x;
      const dy = pos.y - control.pad.y;
      const distance = Math.hypot(dx, dy);
      const triggerRange = control.range + 70;
      if (distance > triggerRange) continue;
      const score = distance / Math.max(1, triggerRange);
      const focus = {
        x: visualPos.x * 0.62 + control.visualPad.x * 0.38,
        y: visualPos.y * 0.62 + control.visualPad.y * 0.38,
      };
      if (!best || score < best.score) best = { enemyId: enemy.id, focus, score };
    }
  }
  return best;
}

export function defenseCameraSignal(
  previous: DefenseRunState | null,
  current: DefenseRunState | null,
  content: DefenseContent,
): DefenseCameraSignal {
  if (!previous || !current || previous.runId !== current.runId) {
    return { kind: 'NONE', enemyId: null, focus: null, reason: null };
  }

  const addedTower = current.towers.find(tower => !previous.towers.some(before => before.id === tower.id));
  if (addedTower) {
    const pad = content.map.pads.find(item => item.id === addedTower.padId);
    if (pad) {
      return {
        kind: 'APPROACH',
        enemyId: null,
        focus: defenseVisualPadPoint(content.map.id, pad),
        reason: 'TOWER_PLACEMENT',
      };
    }
  }

  if (current.status !== 'RUNNING') {
    return { kind: 'NONE', enemyId: null, focus: null, reason: null };
  }

  const previousById = new Map(previous.enemies.map(enemy => [enemy.id, enemy]));

  if (current.waveId !== previous.waveId) {
    const first = current.enemies[0];
    return {
      kind: 'APPROACH',
      enemyId: first?.id ?? null,
      focus: first
        ? defenseVisualPositionAtDistance(content.map.id, content.map.path, first.distance)
        : defenseVisualPositionAtDistance(content.map.id, content.map.path, 0),
      reason: 'WAVE_ENTRY',
    };
  }

  const newlySpawned = current.enemies.find(enemy => !previousById.has(enemy.id));
  if (newlySpawned) {
    return {
      kind: 'APPROACH',
      enemyId: newlySpawned.id,
      focus: defenseVisualPositionAtDistance(content.map.id, content.map.path, newlySpawned.distance),
      reason: 'RISK_ENTRY',
    };
  }

  for (const enemy of current.enemies) {
    const before = previousById.get(enemy.id);
    if (!before) continue;
    const beforeSlow = activeSlowSources(before, previous.tick);
    const nowSlow = activeSlowSources(enemy, current.tick);
    const newlySlowed = [...nowSlow].some(source => !beforeSlow.has(source));
    if (newlySlowed) {
      const relationship = controlThreat(current, content);
      return {
        kind: 'IMPACT',
        enemyId: enemy.id,
        focus: relationship?.enemyId === enemy.id
          ? relationship.focus
          : defenseVisualPositionAtDistance(content.map.id, content.map.path, enemy.distance),
        reason: 'CONTROL_INTERVENTION',
      };
    }
  }

  const currentVeiled = current.enemies.find(enemy => enemy.enemyId === 'VEILED');
  if (currentVeiled) {
    const before = previousById.get(currentVeiled.id);
    if (before && !isEnemyRevealed(before, previous) && isEnemyRevealed(currentVeiled, current)) {
      return {
        kind: 'APPROACH',
        enemyId: currentVeiled.id,
        focus: defenseVisualPositionAtDistance(content.map.id, content.map.path, currentVeiled.distance),
        reason: 'VEILED_REVEAL',
      };
    }
  }

  const nowThreat = controlThreat(current, content);
  const beforeThreat = controlThreat(previous, content);
  if (nowThreat && (!beforeThreat || beforeThreat.enemyId !== nowThreat.enemyId)) {
    return {
      kind: 'APPROACH',
      enemyId: nowThreat.enemyId,
      focus: nowThreat.focus,
      reason: 'CONTROL_APPROACH',
    };
  }

  return { kind: 'NONE', enemyId: null, focus: null, reason: null };
}

export function defenseCameraScale(mode: DefenseCameraMode, portrait: boolean): number {
  if (mode === 'IMPACT_CLOSE_UP') return portrait ? 1.18 : 1.28;
  if (mode === 'THREAT_APPROACH') return portrait ? 1.10 : 1.16;
  if (mode === 'RETURN_RECOVER') return portrait ? 1.04 : 1.07;
  return 1;
}

export function useDefenseCamera(
  state: DefenseRunState | null,
  content: DefenseContent,
  portrait: boolean,
): DefenseCameraPresentation {
  const previousRef = useRef<DefenseRunState | null>(null);
  const lastApproachTickRef = useRef(-9999);
  const timersRef = useRef<number[]>([]);
  const [mode, setMode] = useState<DefenseCameraMode>('STRATEGIC_BASE');
  const [focus, setFocus] = useState<DefensePoint | null>(null);
  const [focusEnemyId, setFocusEnemyId] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [manualScale, setManualScale] = useState(1);

  const clearTimers = () => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  };

  useEffect(() => {
    const previous = previousRef.current;
    const signal = defenseCameraSignal(previous, state, content);
    previousRef.current = state;

    if (!state || state.status === 'WON' || state.status === 'LOST') {
      clearTimers();
      setMode('STRATEGIC_BASE');
      setFocus(null);
      setFocusEnemyId(null);
      setReason(null);
      return;
    }

    if (signal.kind === 'IMPACT' && signal.focus) {
      clearTimers();
      setFocus(signal.focus);
      setFocusEnemyId(signal.enemyId);
      setReason(signal.reason);
      setMode('IMPACT_CLOSE_UP');
      timersRef.current.push(window.setTimeout(() => setMode('RETURN_RECOVER'), 130));
      timersRef.current.push(window.setTimeout(() => {
        setMode('STRATEGIC_BASE');
        setFocus(null);
        setFocusEnemyId(null);
        setReason(null);
      }, 560));
      return;
    }

    if (signal.kind === 'APPROACH' && signal.focus && state.tick - lastApproachTickRef.current >= 40) {
      clearTimers();
      lastApproachTickRef.current = state.tick;
      setFocus(signal.focus);
      setFocusEnemyId(signal.enemyId);
      setReason(signal.reason);
      setMode('THREAT_APPROACH');
      timersRef.current.push(window.setTimeout(() => setMode('RETURN_RECOVER'), 520));
      timersRef.current.push(window.setTimeout(() => {
        setMode('STRATEGIC_BASE');
        setFocus(null);
        setFocusEnemyId(null);
        setReason(null);
      }, 900));
    }
  }, [state, content]);

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    setManualScale(1);
  }, [state?.runId, content.map.id]);

  const zoomIn = () => setManualScale(current => Math.min(1.8, Math.round((current + 0.2) * 10) / 10));
  const zoomOut = () => setManualScale(current => Math.max(1, Math.round((current - 0.2) * 10) / 10));
  const resetZoom = () => setManualScale(1);

  const baseFrame = useMemo(
    () => defenseMapFrame(content.map.id, portrait, content.map.width, content.map.height),
    [content.map.id, content.map.width, content.map.height, portrait],
  );

  const focusPercent = focus
    ? defenseMapPointPercent(baseFrame, focus.x, focus.y)
    : { left: 50, top: 50, visible: true };

  return {
    mode,
    scale: Math.min(1.8, defenseCameraScale(mode, portrait) * manualScale),
    manualScale,
    focus: {
      left: Math.max(8, Math.min(92, focusPercent.left)),
      top: Math.max(8, Math.min(92, focusPercent.top)),
    },
    focusEnemyId,
    reason,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
