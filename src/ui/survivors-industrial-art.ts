import type { Hazard, HazardType } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { SpritePose } from './survivors-sprite-motion';
import { drawProp } from './survivors-equipment-art';
import { suspendedLoadPose } from './survivors-animation-rig';
import { bossPattern } from '../engine/survivors-boss-pattern';

export const INDUSTRIAL_HAZARD_ART = '/assets/survivors/industrial-hazards-v3.webp';
export const INDUSTRIAL_CONTACT_ART = '/assets/survivors/industrial-contacts-v3.webp';
export const INDUSTRIAL_CRANE_ART = '/assets/survivors/crane-load-v4.webp';
export const INDUSTRIAL_CRANE_BOSS_ART = '/assets/survivors/crane-boss-load-v1.webp';
export const INDUSTRIAL_CART_BOSS_ART = '/assets/survivors/runaway-carrier-boss-v1.webp';

export function usesCarrierBossArt(h:Pick<Hazard,'type'|'isStageBoss'>):boolean {
  return h.type==='RUNAWAY_CART'&&h.isStageBoss===true;
}

export function cartActionPose(h: Pick<Hazard,'motion'|'isStageBoss'>, reduced: boolean): {lean:number;compression:number;brake:number} {
  if (reduced || !h.motion) return {lean:0,compression:0,brake:0};
  const {phase,timer}=h.motion;
  if (phase === 'warning') {
    const t=Math.max(0,Math.min(1,1-timer/(h.isStageBoss?1.2:.9)));
    return {lean:-.025*t,compression:.035*t,brake:0};
  }
  if (phase === 'charge') return {lean:.035,compression:.018,brake:0};
  const brake=phase==='cooldown'?Math.max(0,Math.min(1,(timer-.8)/.3)):0;
  return {lean:-.04*brake,compression:.045*brake,brake};
}

export function craneArtPose(radius:number,clock:number,reduced:boolean,elevation?:number) {
  const sway=suspendedLoadPose(reduced?0:clock);
  const size=Math.min(220,Math.max(112,radius*2.7));
  const bottom=elevation===undefined?sway.y+16:16-elevation;
  return {x:elevation===undefined?sway.x:0,bottom,size,top:bottom-size};
}

export function craneAttackElevation(h:Hazard,reduced:boolean):number {
  if(reduced||!h.isStageBoss||!h.motion)return 0;
  if(h.motion.phase==='warning') {
    const descent=Math.max(0,Math.min(1,1-h.motion.timer/.3));
    return 70*(1-descent*descent);
  }
  if(h.motion.phase==='spent')return 70*Math.max(0,Math.min(1,(bossPattern(h).recovery-h.motion.timer)/.5));
  return 0;
}

export function drawIndustrialCrane(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,radius:number,clock:number,reduced:boolean,reaction:number,elevation?:number):boolean {
  if(!atlas?.naturalWidth)return false;
  const p=craneArtPose(radius,clock,reduced,elevation);
  ctx.save();ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();
  ctx.ellipse(p.x,2,radius*1.35,radius*.48,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(203,213,225,.65)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(p.x,p.top+3);ctx.lineTo(0,-380);ctx.stroke();
  ctx.translate(p.x,p.bottom);
  if(!reduced)ctx.rotate(Math.min(1,Math.max(0,reaction))*.016);
  const drawn=drawProp(ctx,atlas,0,0,0,p.size);
  ctx.restore();return drawn;
}

export function industrialHazardCell(h: Pick<Hazard, 'type' | 'variant'>, ground: string): number | null {
  if (h.type === 'RUNAWAY_CART') return h.variant === 'reinforced_cart' ? 1 : ground.includes('datacenter') ? 2 : 0;
  if (h.type === 'FALLING_DEBRIS') return 3;
  if (h.type === 'GAS_LEAK') return h.variant === 'split_gas' ? 5 : 4;
  return null;
}

/** Presentation follows the existing hazard phase; it never changes collision or timing. */
export function drawIndustrialHazard(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | undefined, h: Hazard, pose: SpritePose, ground: string, clock: number, reduced: boolean, elevation: number, carrierBoss?:HTMLImageElement): boolean {
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
    const heading=h.motion&&['warning','charge','cooldown'].includes(h.motion.phase)?Math.atan2(h.motion.directionY,h.motion.directionX):Math.atan2(pose.directionY,pose.facing);
    ctx.save();ctx.rotate(heading);
    const beam=ctx.createLinearGradient(size*.2,0,size*.9,0);
    beam.addColorStop(0,h.isStageBoss?'rgba(255,218,152,.24)':'rgba(255,236,194,.14)');beam.addColorStop(1,'rgba(255,236,194,0)');
    ctx.fillStyle=beam;
    for(const side of [-1,1]){
      ctx.beginPath();ctx.moveTo(size*.2,side*size*.12-3);ctx.lineTo(size*.9,side*size*.12-14);
      ctx.lineTo(size*.9,side*size*.12+14);ctx.lineTo(size*.2,side*size*.12+3);ctx.closePath();ctx.fill();
    }
    ctx.restore();
    const facing=h.motion&&['warning','charge','cooldown'].includes(h.motion.phase)&&Math.abs(h.motion.directionX)>.04?(h.motion.directionX<0?-1:1):pose.facing;
    const action=cartActionPose(h,reduced);
    ctx.scale(facing, 1);
    // A brief chassis brace, not a teleporting knockback or per-frame texture filter.
    ctx.transform(1, 0, pose.lean+action.lean, 1 - action.compression - (reduced ? 0 : pose.reaction * .06), 0, 0);
  }
  const pressure = !reduced && h.variant === 'pulse_gas' ? 1 + Math.sin(clock * 8) * .045 : 1;
  ctx.scale(pressure, pressure);
  if (gas) ctx.globalAlpha *= .82;
  const boss=usesCarrierBossArt(h)&&carrierBoss?.naturalWidth;
  const drawn = drawProp(ctx, boss?carrierBoss:atlas, boss?0:cell, 0, gas ? size * .43 : -elevation, size);
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
