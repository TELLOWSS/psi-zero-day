import type { HazardType, PatrolStageDefinition } from '../domain/patrol-survivors';
import {PATROL_DIFFICULTIES, type PatrolDifficulty} from '../domain/survivors-challenge';

/** Authored map progression; independent of permanent upgrades and player performance. */
export function difficultyProfile(stageNumber: number) {
  const n = Math.max(1, Math.min(20, Math.floor(stageNumber)));
  return {
    openingInterval: 1.65 - (n - 1) * .035,
    finalInterval: .72 - (n - 1) * .012,
    activeLimit: 18 + (n - 1) * 2,
    telegraphLimit: n <= 5 ? 2 : n <= 12 ? 3 : 4,
    hpScale: 1 + (n - 1) * .018,
    introductionTime: n <= 3 ? 30 : n <= 10 ? 20 : 12,
  };
}

/** Recovery follows each pressure wave, with room to read the first boss alert. */
export function spawnPressure(stageNumber: number, time: number, difficulty:PatrolDifficulty='standard') {
  const p = difficultyProfile(stageNumber);
  const progress = Math.max(0, Math.min(1, time / 180));
  const recovery = (time >= 60 && time < 68) || (time >= 95 && time < 105) || (time >= 140 && time < 150);
  const contract=PATROL_DIFFICULTIES[difficulty];
  return { ...p, hpScale:p.hpScale*contract.hp, recovery, interval: (p.openingInterval + (p.finalInterval - p.openingInterval) * progress) * (recovery ? 1.8 : 1)*contract.spawn };
}

const introductoryMixes: readonly (readonly HazardType[])[] = [
  ['UNHELMETED', 'UNHELMETED', 'RUNAWAY_CART'],
  ['UNHELMETED', 'GAS_LEAK', 'GAS_LEAK'],
  ['UNHELMETED', 'FALLING_DEBRIS', 'RUNAWAY_CART'],
  ['UNHELMETED', 'RUNAWAY_CART', 'RUNAWAY_CART', 'GAS_LEAK'],
  ['UNHELMETED', 'GAS_LEAK', 'FALLING_DEBRIS', 'RUNAWAY_CART'],
];
export function selectStageHazard(stage: PatrolStageDefinition, time: number, roll: number): HazardType {
  if (time < difficultyProfile(stage.stageNumber).introductionTime) return 'UNHELMETED';
  // Bosses are authored one-off events, never accidental ordinary spawns.
  const mix = (stage.hazardMix ?? introductoryMixes[Math.max(0, Math.min(4, stage.stageNumber - 1))] ?? ['UNHELMETED'])
    .filter(type => type !== 'CRANE_BOSS');
  return mix[Math.min(mix.length - 1, Math.max(0, Math.floor(roll * mix.length)))] ?? 'UNHELMETED';
}
