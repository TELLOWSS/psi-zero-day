import type { Hazard, HazardType } from '../domain/patrol-survivors';

/** Five encounter families per chapter; no dependence on weapons or device performance. */
export function stageThreatFamily(stageNumber: number): number {
  const stage = Math.max(1, Math.min(50, Math.floor(stageNumber)));
  return (stage - 1 + Math.floor((stage - 1) / 5) * 2) % 5;
}

export function stageThreatTraits(type: HazardType, stage: number, time: number, introductionTime: number, roll: number): Pick<Hazard, 'variant' | 'behavior'> {
  if (stage <= 1 || time < introductionTime + 8) return {};
  const family = stageThreatFamily(stage);
  // The first example is readable on its own; later waves mix specialist and baseline risks.
  if (roll >= .68) return {};
  if (type === 'GAS_LEAK') {
    if (family === 1) return { variant: 'pulse_gas' };
    if (family === 3) return { variant: 'split_gas' };
    if (family === 4 || stage >= 6 && family === 0) return { behavior: 'crosswind' };
  }
  if (type === 'RUNAWAY_CART') {
    if (family === 2) return { variant: 'reinforced_cart' };
    if (family === 3 || stage >= 6 && family === 1) return { behavior: 'flanking_cart' };
  }
  if (type === 'FALLING_DEBRIS' && (family === 4 || stage >= 6 && family === 2)) return { behavior: 'wide_debris' };
  return {};
}

/** A side approach changes positioning; the subsequent warning still locks its direction. */
export function flankingApproach(h: Hazard, player: { x: number; y: number }, dt: number, speed: number): boolean {
  if (h.behavior !== 'flanking_cart' || h.motion?.phase !== 'approach') return false;
  const dx = player.x - h.x, dy = player.y - h.y, distance = Math.hypot(dx, dy) || 1;
  if (distance <= 320) return false;
  const side = h.id.charCodeAt(h.id.length - 1) % 2 ? 1 : -1;
  const offsetX = dx / distance - dy / distance * .7 * side;
  const offsetY = dy / distance + dx / distance * .7 * side;
  const length = Math.hypot(offsetX, offsetY);
  h.x += offsetX / length * speed * .65 * dt;
  h.y += offsetY / length * speed * .65 * dt;
  return true;
}
