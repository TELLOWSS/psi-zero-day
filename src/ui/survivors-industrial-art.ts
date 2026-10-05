import type { Hazard, HazardType } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { SpritePose } from './survivors-sprite-motion';
import { drawProp } from './survivors-equipment-art';

export const INDUSTRIAL_HAZARD_ART = '/assets/survivors/industrial-hazards-v3.webp';
export const INDUSTRIAL_CONTACT_ART = '/assets/survivors/industrial-contacts-v3.webp';

export function industrialHazardCell(h: Pick<Hazard, 'type' | 'variant'>, ground: string): number | null {
  if (h.type === 'RUNAWAY_CART') return h.variant === 'reinforced_cart' ? 1 : ground.includes('datacenter') ? 2 : 0;
  if (h.type === 'FALLING_DEBRIS') return 3;
  if (h.type === 'GAS_LEAK') return h.variant === 'split_gas' ? 5 : 4;
  return null;
}

/** Presentation follows the existing hazard phase; it never changes collision or timing. */
export function drawIndustrialHazard(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | undefined, h: Hazard, pose: SpritePose, ground: string, clock: number, reduced: boolean, elevation: number): boolean {
  const cell = industrialHazardCell(h, ground);
  if (cell === null || !atlas?.naturalWidth) return false;
  const gas = h.type === 'GAS_LEAK';
  const size = gas ? h.radius * 2.05 : h.type === 'FALLING_DEBRIS' ? Math.max(32, h.radius * 2.4) : Math.max(58, h.radius * 2.6);
  ctx.save();
  if (!gas) {
    ctx.fillStyle = 'rgba(0,0,0,.28)';ctx.beginPath();
    ctx.ellipse(0, 2, size * .4, size * .13, 0, 0, Math.PI * 2);ctx.fill();
  }
  if (h.type === 'RUNAWAY_CART') {
    ctx.scale(pose.facing, 1);
    // A brief chassis brace, not a teleporting knockback or per-frame texture filter.
    ctx.transform(1, 0, pose.lean, 1 - (reduced ? 0 : pose.reaction * .06), 0, 0);
  }
  const pressure = !reduced && h.variant === 'pulse_gas' ? 1 + Math.sin(clock * 8) * .045 : 1;
  ctx.scale(pressure, pressure);
  if (gas) ctx.globalAlpha *= .82;
  const drawn = drawProp(ctx, atlas, cell, 0, gas ? size * .43 : -elevation, size);
  ctx.restore();
  return drawn;
}

export function industrialContactCell(actor: HazardType | undefined, critical: boolean): number | null {
  const material = actor === 'RUNAWAY_CART' || actor === 'CRANE_BOSS' ? 0 : actor === 'FALLING_DEBRIS' ? 1 : actor === 'GAS_LEAK' ? 2 : null;
  return material === null ? null : material + (critical ? 3 : 0);
}

export function drawIndustrialContact(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | undefined, event: ProjectileFeedback, age: number, duration: number, reduced: boolean, busy: boolean): boolean {
  const cell = industrialContactCell(event.actorKind, Boolean(event.critical));
  if (event.phase !== 'impact' || event.worker || reduced || cell === null || !atlas?.naturalWidth) return false;
  const t = Math.min(1, age / duration);
  const size = (event.critical ? 60 : 40) * (1 + t * .28);
  ctx.save();ctx.rotate(event.angle);
  ctx.globalAlpha = (1 - t) ** 2 * (busy ? .6 : .95);
  // Each painted contact core is left of center; align it to the engine's hit point.
  const drawn = drawProp(ctx, atlas, cell, size * .18, size * .5, size);
  ctx.restore();
  return drawn;
}
