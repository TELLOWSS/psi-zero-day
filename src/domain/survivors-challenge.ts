export type PatrolDifficulty = 'story' | 'standard' | 'hard' | 'extreme';
/** Player-selected contracts. Never adapt difficulty to upgrades or performance. */
export const PATROL_DIFFICULTIES = {
  story: {spawn:1.25,hp:.75,speed:.9,reward:1,supplyEvery:18,supplyCooldown:16},
  standard: {spawn:.9,hp:1.15,speed:1,reward:1,supplyEvery:24,supplyCooldown:22},
  hard: {spawn:.8,hp:1.35,speed:1.08,reward:1.5,supplyEvery:28,supplyCooldown:26},
  extreme: {spawn:.7,hp:1.55,speed:1.12,reward:2,supplyEvery:32,supplyCooldown:30},
} as const;
export const DIFFICULTY_WARNING_SCALE={story:1.5,standard:1.2,hard:1,extreme:.95} as const;
