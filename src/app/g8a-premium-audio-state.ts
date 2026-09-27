import type { DefenseRunState } from '../domain/defense';
import premiumRaw from '../../content/defense/g8a-premium-audio-production.json';

export type G8aPremiumMusicState =
  | 'READY'
  | 'WAVE_BUILD'
  | 'SWIFT_THREAT'
  | 'CONTROL_INTERVENTION'
  | 'RESOLUTION';

interface RuntimeStateContract {
  readonly state: G8aPremiumMusicState;
  readonly active: readonly string[];
  readonly musicGainDb?: number;
  readonly duckMusicDb?: number;
  readonly duckAttackMs?: number;
  readonly duckReleaseMs?: number;
}

interface PremiumAudioStateContract {
  readonly scope: string;
  readonly dynamicScore: {
    readonly runtimeStates: readonly RuntimeStateContract[];
  };
}

const contract = premiumRaw as PremiumAudioStateContract;

export interface G8aPremiumMixSnapshot {
  readonly state: G8aPremiumMusicState;
  readonly activeScoreIds: readonly string[];
  readonly musicGainDb: number;
  readonly duckMusicDb: number;
  readonly duckAttackMs: number;
  readonly duckReleaseMs: number;
  readonly swiftPresent: boolean;
  readonly controlIntervening: boolean;
  readonly resolution: boolean;
}

function activeSlowOnSwift(state: DefenseRunState): boolean {
  return state.enemies.some(enemy =>
    enemy.enemyId === 'SWIFT'
    && enemy.slowEffects.some(effect => effect.startTick <= state.tick && state.tick < effect.endTick)
  );
}

function controlPresent(state: DefenseRunState): boolean {
  return state.towers.some(tower => tower.towerId === 'CONTROL');
}

export function g8aPremiumMusicState(state: DefenseRunState | null): G8aPremiumMusicState {
  if (!state || state.status === 'READY') return 'READY';
  if (state.status === 'WON' || state.status === 'LOST') return 'RESOLUTION';

  const swiftPresent = state.enemies.some(enemy => enemy.enemyId === 'SWIFT');
  const controlIntervening = swiftPresent && controlPresent(state) && activeSlowOnSwift(state);
  if (controlIntervening) return 'CONTROL_INTERVENTION';
  if (swiftPresent) return 'SWIFT_THREAT';
  return 'WAVE_BUILD';
}

export function g8aPremiumMixSnapshot(state: DefenseRunState | null): G8aPremiumMixSnapshot {
  const mixState = g8aPremiumMusicState(state);
  const runtime = contract.dynamicScore.runtimeStates.find(item => item.state === mixState);
  if (!runtime) throw new Error('Missing G8-A premium audio runtime state: ' + mixState);

  const swiftPresent = Boolean(state?.enemies.some(enemy => enemy.enemyId === 'SWIFT'));
  const controlIntervening = Boolean(state && swiftPresent && controlPresent(state) && activeSlowOnSwift(state));
  const resolution = Boolean(state && (state.status === 'WON' || state.status === 'LOST'));

  return {
    state: mixState,
    activeScoreIds: runtime.active,
    musicGainDb: runtime.musicGainDb ?? 0,
    duckMusicDb: runtime.duckMusicDb ?? 0,
    duckAttackMs: runtime.duckAttackMs ?? 120,
    duckReleaseMs: runtime.duckReleaseMs ?? 480,
    swiftPresent,
    controlIntervening,
    resolution,
  };
}

export function g8aIsPremiumAudioScope(mapId: string | null | undefined): boolean {
  return mapId === 'map-apt-bottom-up-excavation-01';
}
