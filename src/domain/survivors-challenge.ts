export type PatrolDifficulty = 'story' | 'standard' | 'hard' | 'extreme';
/** Player-selected contracts. Never adapt difficulty to upgrades or performance. */
export const PATROL_DIFFICULTIES = {
  story: {spawn:1.25,hp:.75,speed:.9,reward:1,supplyEvery:18,supplyCooldown:16},
  standard: {spawn:.72,hp:1.8,speed:1.12,reward:1,supplyEvery:24,supplyCooldown:22},
  hard: {spawn:.50,hp:2.4,speed:1.22,reward:1.5,supplyEvery:28,supplyCooldown:26},
  extreme: {spawn:.38,hp:3,speed:1.30,reward:2,supplyEvery:32,supplyCooldown:30},
} as const;
