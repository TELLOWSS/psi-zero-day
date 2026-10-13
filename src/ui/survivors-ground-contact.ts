import { footstep, type Joint } from './survivors-animation-rig';

/** World-space foot travel. No isometric compression: movement is already in world coordinates. */
export function gaitStride(running: boolean, directionY: number): number {
  return (running ? 66 : 54) * Math.sqrt(1 - .64 * Math.min(1, directionY * directionY));
}

export function footTravel(cycle: number, opposite: boolean, running: boolean, directionY: number, blend: number, stride = running ? 66 : 54) {
  const step = footstep(cycle, opposite, running, stride);
  const dy = Math.max(-1, Math.min(1, directionY));
  return { x: step.offset * Math.sqrt(1 - dy * dy) * blend, y: step.offset * dy * blend, lift: step.lift * blend, planted: step.planted };
}

/** The shadow sits under the authored boot, including the higher far foot in the original sprite. */
export function soleContact(sole: Joint, aspect: number, height: number, travel: { x: number; y: number }) {
  return { x: (sole.x - .5) * aspect * height + travel.x, y: (sole.y - 1) * height + travel.y };
}
