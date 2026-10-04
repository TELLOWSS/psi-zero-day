import type { PatrolStageId } from './patrol-survivors';

export type FrontPressureSide = 0 | 1 | 2 | 3;

export interface FrontPressureBand {
  readonly bucket: number;
  readonly side: FrontPressureSide;
  readonly anchorRatio: number;
  readonly spread: number;
}

/**
 * Stage 01 presentation/gameplay rhythm helper.
 *
 * It groups diffuse worker/gas spawns into a readable approach front without
 * increasing spawn count, HP, damage, speed, or the active hazard cap.
 * The output is deterministic for the same seed/time and changes every 18 s.
 */
export function stageFrontPressure(
  stageId: PatrolStageId,
  gameTime: number,
  seed = 0x505349,
): FrontPressureBand | null {
  if (stageId !== 'stage_01') return null;
  const bucket = Math.floor(Math.max(0, gameTime) / 18);
  const side = ((bucket + (seed & 3)) % 4) as FrontPressureSide;
  const mixed = (Math.imul((bucket + 1) ^ seed, 0x45d9f3b) ^ (seed >>> 7)) >>> 0;
  const unit = mixed / 0xffffffff;
  return {
    bucket,
    side,
    anchorRatio: 0.28 + unit * 0.44,
    spread: 210,
  };
}
