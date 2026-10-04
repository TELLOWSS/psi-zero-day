export type PatrolDifficulty = 'story' | 'standard' | 'hard' | 'extreme';
/** Player-selected contracts. Never adapt difficulty to upgrades or performance. */
export const PATROL_DIFFICULTIES = {
  story: {spawn:1.25,hp:.75,speed:.9,reward:1,supplyEvery:12},
  standard: {spawn:1,hp:1,speed:1,reward:1,supplyEvery:12},
  hard: {spawn:.72,hp:1.8,speed:1.12,reward:1.5,supplyEvery:10},
  extreme: {spawn:.55,hp:2.7,speed:1.2,reward:2,supplyEvery:8},
} as const;
