export type PatrolScoreState = 'foundation' | 'pressure' | 'heavy_risk';
/** Presentation selection only: does not change engine risk or spawn rules. */
export function selectPatrolScore(hpRatio: number, hazards: number, boss: boolean, previous: PatrolScoreState): PatrolScoreState {
  if (boss || hpRatio <= 0.3) return 'heavy_risk';
  if (previous === 'heavy_risk' && hpRatio < 0.45) return previous;
  if (hazards >= 18 || hpRatio < 0.6) return 'pressure';
  if (previous === 'pressure' && (hazards > 10 || hpRatio < 0.7)) return previous;
  return 'foundation';
}
