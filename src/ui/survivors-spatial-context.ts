import type { StageHazardObject } from '../domain/patrol-survivors';
import combatText from '../../content/localization/survivors-combat-ko.json';

/** Stage01 floor paint identifies existing equipment. It creates no new obstacle or danger radius. */
export function drawStageSpatialContext(ctx: CanvasRenderingContext2D, hazards: StageHazardObject[]): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const h of hazards) {
    if (h.type !== 'explosive_barrel' && h.type !== 'floodlight_tower') continue;
    const light = h.type === 'floodlight_tower';
    const resolved = !light && h.state === 'destroyed';
    const label = light ? (h.y < 450 ? combatText.north_light : combatText.south_light)
      : (h.x < 700 ? combatText.west_storage : combatText.east_storage);
    ctx.strokeStyle = resolved ? 'rgba(34,197,94,.35)' : light ? 'rgba(250,204,21,.22)' : 'rgba(251,146,60,.3)';
    ctx.lineWidth = 2;
    const half = light ? 38 : 30;
    // Corner paint stays close to the real equipment; it cannot resemble an incoming attack lane.
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      ctx.beginPath();ctx.moveTo(h.x + sx * (half - 12), h.y + sy * half);
      ctx.lineTo(h.x + sx * half, h.y + sy * half);ctx.lineTo(h.x + sx * half, h.y + sy * (half - 12));ctx.stroke();
    }
    ctx.font = '700 13px sans-serif';
    ctx.fillStyle = resolved ? 'rgba(134,239,172,.5)' : 'rgba(226,232,240,.42)';
    ctx.fillText(resolved ? combatText.storage_isolated : label, h.x, h.y + half + 18);
  }
  ctx.restore();
}
