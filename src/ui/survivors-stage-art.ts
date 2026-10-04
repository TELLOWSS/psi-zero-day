import type { StageHazardObject } from '../domain/patrol-survivors';

export interface StageArtProfile { ground: string; accent: string; detail: number; layout: number }
const floor = (name: string) => `/assets/survivors/maps/${name}-v1.png`;
const stage = (ground: string, accent: string, detail: number, layout: number): StageArtProfile => ({ground, accent, detail, layout});
/** Existing twenty-stage campaign only. Art families follow the actual workface, not theme aliases. */
export const STAGE_ART: Record<string, StageArtProfile> = {
  stage_01: stage('/assets/survivors/stage-01-ground-v2.webp', '#d4d8ca', 1, 0),
  stage_02: stage('/assets/survivors/excavation-ground-v3.webp', '#b6c6b2', 1, 1),
  stage_03: stage(floor('highrise'), '#d8e5e0', 1, 2),
  stage_04: stage(floor('winter'), '#c8e4e8', 1, 3),
  stage_05: stage(floor('datacenter'), '#91d9d5', 2, 4),
  stage_06: stage(floor('remodel'), '#dacbbb', 2, 5),
  stage_07: stage('/assets/survivors/demolition-ground-v3.webp', '#e1cdb7', 2, 6),
  stage_08: stage(floor('remodel'), '#d5e0cd', 2, 7),
  stage_09: stage(floor('datacenter'), '#b8d4e0', 2, 8),
  stage_10: stage(floor('datacenter'), '#b8e4c1', 3, 9),
  stage_11: stage(floor('formwork'), '#e0d9bb', 3, 10),
  stage_12: stage(floor('rebar'), '#cbd8dc', 3, 11),
  stage_13: stage(floor('pour'), '#d9dfdc', 3, 12),
  stage_14: stage(floor('highrise'), '#e1cfb9', 3, 13),
  stage_15: stage(floor('scaffold'), '#bbdbd0', 4, 14),
  stage_16: stage(floor('roof'), '#dbe3dc', 4, 15),
  stage_17: stage(floor('waterproof'), '#aad8d5', 4, 16),
  stage_18: stage(floor('finish'), '#dce2dd', 4, 17),
  stage_19: stage(floor('datacenter'), '#c9e7d9', 4, 18),
  stage_20: stage(floor('handover'), '#e6ede4', 5, 19),
};
export function stageArtProfile(id: string): StageArtProfile { return STAGE_ART[id] ?? STAGE_ART.stage_01!; }

/** Paint references real equipment positions and states; it never invents collision or attack zones. */
export function drawStageWorkface(ctx: CanvasRenderingContext2D, id: string, hazards: readonly StageHazardObject[]): void {
  const art = stageArtProfile(id);
  ctx.save(); ctx.strokeStyle = art.accent; ctx.fillStyle = art.accent;
  ctx.globalAlpha = .22; ctx.lineWidth = 1;
  for (const h of hazards) {
    const isolated = h.state === 'destroyed';
    const x = h.x - 40, y = h.y - 28;
    ctx.strokeRect(x, y, 80, 56);
    if (art.detail >= 2) {
      ctx.setLineDash([3, 5]); ctx.strokeRect(x - 7, y - 7, 94, 70); ctx.setLineDash([]);
    }
    if (art.detail >= 3) {
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * 18, y + 60); ctx.lineTo(x + i * 18 + 8, y + 68); ctx.stroke(); }
    }
    if (isolated) {
      ctx.strokeStyle = '#9de8ac'; ctx.beginPath(); ctx.moveTo(x + 28, y + 26); ctx.lineTo(x + 37, y + 35); ctx.lineTo(x + 53, y + 18); ctx.stroke(); ctx.strokeStyle = art.accent;
    }
    if (art.detail >= 4 && h.label) {
      ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(h.label, h.x, y + 84);
    }
  }
  // Survey ticks are flat floor markings; successive workfaces gain finer installation detail.
  if (art.detail >= 2) for (let i = 0; i < art.detail * 3; i++) {
    const x = 110 + i * 80, y = id === 'stage_13' ? 120 : 110 + (art.layout % 3) * 20;
    ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.stroke();
  }
  ctx.restore();
}
