import {workfaceThreatAppearance,workfaceThreatPose} from './survivors-workface-threats';
import {stageThreatAppearance,threatSilhouettePose} from './survivors-threat-appearance';
import type { Hazard, HazardType, PatrolStageDefinition } from '../domain/patrol-survivors';
import type { ProjectileFeedback } from '../domain/survivors-projectile-feedback';
import type { SpritePose } from './survivors-sprite-motion';
import { drawProp,drawPropReaction,registerPropAtlas } from './survivors-equipment-art';
import { WORKFACE_SPECIES } from '../engine/survivors-workface-roster';
import {MATERIAL_FEEL} from '../domain/survivors-material-feel';
import { suspendedLoadPose } from './survivors-animation-rig';
import { bossPattern } from '../engine/survivors-boss-pattern';
import {materialContactMotion,materialFragmentMotion} from './survivors-material-contact-motion';
import {hazardVaporPose,workfaceResolutionAction} from './survivors-hazard-animation';
import {materialFragmentTexture} from './survivors-material-fragments';
import {drawAuthoredMetalImpact} from './survivors-authored-metal-impact';
import {drawAuthoredDebrisImpact} from './survivors-authored-debris-impact';
import {drawAuthoredVaporImpact} from './survivors-authored-vapor-impact';

export const INDUSTRIAL_HAZARD_ART = '/assets/survivors/graphics-v1/industrial-hazards-v4.png';
export const WORKFACE_HAZARD_ART = '/assets/survivors/workface-hazards-v2.png';
const workfaceAtlases=new WeakMap<HTMLImageElement,HTMLImageElement>();
export function workfaceAtlas(base:HTMLImageElement|undefined):HTMLImageElement|undefined {return base&&workfaceAtlases.get(base);}
export function registerWorkfaceHazards(base:HTMLImageElement,image:HTMLImageElement):void {
  registerPropAtlas(image,4,3);workfaceAtlases.set(base,image);
}
export const INDUSTRIAL_CONTACT_ART = '/assets/survivors/industrial-contacts-v3.webp';
export const INDUSTRIAL_CRANE_ART = '/assets/survivors/crane-load-v4.webp';
export const INDUSTRIAL_CRANE_BOSS_ART = '/assets/survivors/crane-boss-load-v1.webp';
export const INDUSTRIAL_CART_BOSS_ART = '/assets/survivors/runaway-carrier-boss-v1.webp';
export const INDUSTRIAL_MATERIAL_BOSS_ART={GAS_LEAK:'/assets/survivors/gas-manifold-boss-v1.webp',FALLING_DEBRIS:'/assets/survivors/collapse-core-boss-v1.webp'} as const;
export type MaterialBossImages=Partial<Record<keyof typeof INDUSTRIAL_MATERIAL_BOSS_ART,HTMLImageElement>>;

export function industrialHazardPlacement(h:Pick<Hazard,'type'|'radius'>,elevation:number,solidBoss=false) {
  const gas=h.type==='GAS_LEAK';
  const size=gas?Math.max(solidBoss?76:0,h.radius*2.05):h.type==='FALLING_DEBRIS'?Math.max(solidBoss?72:32,h.radius*2.4):Math.max(58,h.radius*2.6);
  return {size,y:gas&&!solidBoss?size*.43:-elevation,solid:!gas||solidBoss};
}

export function usesCarrierBossArt(h:Pick<Hazard,'type'|'isStageBoss'>):boolean {
  return h.type==='RUNAWAY_CART'&&h.isStageBoss===true;
}

export function industrialResponse(h:Pick<Hazard,'type'>,pose:Pick<SpritePose,'reaction'|'moving'|'cycle'|'facing'>,reduced:boolean) {
  const reaction=reduced?0:Math.min(1,Math.max(0,pose.reaction));
  const cart=h.type==='RUNAWAY_CART',gas=h.type==='GAS_LEAK';
  const recoil=reaction===0?0:reaction*Math.cos((1-reaction)*Math.PI*1.5);
  return {reaction,compression:cart?reaction*.025:0,tilt:gas?0:recoil*(cart?.032:.045)*pose.facing,
    suspension:!reduced&&cart&&pose.moving?Math.abs(Math.sin(pose.cycle))*.012:0,
    color:gas?'#9de5be':h.type==='FALLING_DEBRIS'?'#e6d6ba':'#ffd995'};
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

/** Shared live/death art selection prevents a cleared monster from changing its identity. */
export function industrialHazardArtwork(atlas:HTMLImageElement|undefined,h:Hazard,ground:string,theme:PatrolStageDefinition['theme'],elevation:number,carrierBoss?:HTMLImageElement,materialBosses?:MaterialBossImages,threatAtlas?:HTMLImageElement,stageNumber=1,workfaceAtlas?:HTMLImageElement) {
  const cell = industrialHazardCell(h, ground);
  if (cell === null || !atlas?.naturalWidth) return null;
  const gas = h.type === 'GAS_LEAK';
  const bossImage=h.isStageBoss?(usesCarrierBossArt(h)?carrierBoss:materialBosses?.[h.type as keyof MaterialBossImages]):undefined;
  const boss=Boolean(bossImage?.naturalWidth);
  const speciesAtlas=atlas&&workfaceAtlases.get(atlas);
  const speciesCell=h.species?WORKFACE_SPECIES.indexOf(h.species):-1;
  const authored=!boss&&speciesCell>=0&&Boolean(speciesAtlas?.naturalWidth);
  const workface=workfaceThreatAppearance(h,stageNumber);
  const useWorkface=Boolean(workface&&workfaceAtlas?.naturalWidth);
  const appearance=stageThreatAppearance(h,stageNumber,theme);
  const useThreat=useWorkface||Boolean(appearance&&threatAtlas?.naturalWidth);
  const source=boss?bossImage:useWorkface?workfaceAtlas:useThreat?threatAtlas:authored?speciesAtlas:atlas;
  const sourceCell=boss?0:useWorkface?workface!.cell:useThreat?appearance!.cell:authored?speciesCell:cell;
  const placement=industrialHazardPlacement(h,elevation,boss||authored&&gas&&!useThreat);
  const size=useThreat&&gas?Math.max(38,placement.size):useThreat&&h.variant==='reinforced_cart'?Math.max(70,placement.size):placement.size;

  return {source,sourceCell,placement,size,useThreat,useWorkface,workface,authored,boss,gas,action:useWorkface?workfaceResolutionAction(h.type,workface!.subject):undefined};
}

/** Presentation follows the existing hazard phase; it never changes collision or timing. */
export function drawIndustrialHazard(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | undefined, h: Hazard, pose: SpritePose, ground: string, theme:PatrolStageDefinition['theme'], clock: number, reduced: boolean, elevation: number, carrierBoss?:HTMLImageElement,materialBosses?:MaterialBossImages,threatAtlas?:HTMLImageElement,stageNumber=1,workfaceAtlas?:HTMLImageElement,contactAtlas?:HTMLImageElement,busy=false,onArtwork?:(art:{image:HTMLImageElement;cell:number;size:number;facing:number;y:number;action?:ReturnType<typeof workfaceResolutionAction>})=>void): boolean {
  const art=industrialHazardArtwork(atlas,h,ground,theme,elevation,carrierBoss,materialBosses,threatAtlas,stageNumber,workfaceAtlas);
  if(!art)return false;
  const {source,sourceCell,placement,size,useThreat,useWorkface,authored,boss,gas}=art;

  const response=industrialResponse(h,pose,reduced);let artworkFacing=1;
  ctx.save();
  if (placement.solid) {
    ctx.fillStyle = `rgba(0,0,0,${.28/(1+Math.max(0,elevation)/65)})`;ctx.beginPath();
    ctx.ellipse(0, 2, size * .4, size * .13, 0, 0, Math.PI * 2);ctx.fill();
  }
  if (h.type === 'RUNAWAY_CART') {
    const heading=h.motion&&['warning','charge','cooldown'].includes(h.motion.phase)?Math.atan2(h.motion.directionY,h.motion.directionX):Math.atan2(pose.directionY,pose.facing*Math.sqrt(Math.max(0,1-pose.directionY**2)));
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
    artworkFacing=useThreat?-facing:facing;ctx.scale(artworkFacing, 1);
    // Rigid metal rocks on its suspension; the chassis and wheels never squash.
    ctx.translate(0,-size*(action.compression+response.compression+response.suspension)*.28);
    ctx.rotate((pose.lean+action.lean+response.tilt)*.8);
  }
  if(h.type==='FALLING_DEBRIS'&&response.reaction>0){ctx.translate(0,-elevation);ctx.rotate(response.tilt);ctx.translate(0,elevation);}
  const pressure = !boss&&!placement.solid&&!reduced&&gas ? 1+Math.sin(clock*(h.variant==='pulse_gas'?8:2.2)+pose.cycle)*(h.variant==='pulse_gas'?.045:.022) : 1;
  ctx.scale(pressure, pressure);
  if(gas&&!placement.solid&&response.reaction>0)ctx.scale(1+response.reaction*.055,1-response.reaction*.055);
  if (gas&&!boss&&!authored) ctx.globalAlpha *= .82;
  const silhouette=gas&&placement.solid?{x:0,y:0,rotation:0,scaleX:1,scaleY:1}:useWorkface?workfaceThreatPose(h,pose,clock,reduced):useThreat?threatSilhouettePose(h,clock,reduced):{x:0,y:0,rotation:0,scaleX:1,scaleY:1};
  ctx.save();ctx.translate(silhouette.x,silhouette.y);ctx.rotate(silhouette.rotation);ctx.scale(silhouette.scaleX,silhouette.scaleY);
  const drawn = drawProp(ctx, source, sourceCell, 0, placement.y, size);
  if(drawn&&source)onArtwork?.({image:source,cell:sourceCell,size,facing:artworkFacing,y:placement.y+elevation,action:art.action});
  if(drawn&&h.species&&h.hp<h.maxHp&&!gas){
    const wear=Math.max(0,Math.min(1,1-h.hp/Math.max(1,h.maxHp))),profile=MATERIAL_FEEL[h.species];
    ctx.save();ctx.strokeStyle=profile.action==='crumble'?'#514b43':profile.color;ctx.globalAlpha=.35*wear;ctx.lineWidth=1.2;
    const count=wear>.65?3:wear>.3?2:1;
    for(let i=0;i<count;i++){const x=(i-1)*size*.12,y=placement.y-size*(.35+i*.1);ctx.beginPath();ctx.moveTo(x-5,y-8);ctx.lineTo(x+2,y-2);ctx.lineTo(x-2,y+3);ctx.lineTo(x+5,y+8);ctx.stroke();}ctx.restore();
  }
  if(drawn&&response.reaction>0)drawPropReaction(ctx,source,sourceCell,0,placement.y,size,response.color,response.reaction*.24);
  ctx.restore();
  if(drawn&&gas&&!reduced&&contactAtlas){
    const texture=materialFragmentTexture(contactAtlas,2,5);
    if(texture||useThreat)for(let i=0;i<(busy?1:3);i++){
      const flow=hazardVaporPose(h,clock,i),w=size*flow.scale;
      ctx.save();ctx.translate(flow.x*size,placement.y-size*.55+flow.y*size);ctx.rotate(flow.rotation);ctx.globalAlpha*=flow.alpha*(busy?.55:1);
      if(useThreat)drawProp(ctx,source,sourceCell,0,w*.35,w*1.6);else if(texture)ctx.drawImage(texture,-w*.5,-w*.5,w,w);ctx.restore();
    }
  }

  if(drawn&&h.signatureEventId&&!boss){
    const pulse=reduced?1:.72+.28*Math.sin(clock*7);
    const themeAccent:Record<PatrolStageDefinition['theme'],string>={
      surface_logistics:'#fb923c',deep_excavation:'#d97706',highrise_slab:'#38bdf8',curing_chamber:'#7dd3fc',datacenter:'#a78bfa'
    };
    const accent=themeAccent[theme];
    ctx.save();ctx.globalAlpha=.35*pulse;ctx.strokeStyle=accent;ctx.lineWidth=2;
    if(theme==='surface_logistics'){
      ctx.setLineDash([8,5]);ctx.beginPath();ctx.ellipse(0,3,size*.52,size*.18,0,0,Math.PI*2);ctx.stroke();
    } else if(theme==='deep_excavation'){
      ctx.fillStyle='rgba(120,72,28,.18)';ctx.beginPath();ctx.ellipse(0,5,size*.56,size*.2,0,0,Math.PI*2);ctx.fill();
      ctx.setLineDash([4,7]);ctx.beginPath();ctx.ellipse(0,4,size*.6,size*.23,0,0,Math.PI*2);ctx.stroke();
    } else if(theme==='highrise_slab'){
      ctx.beginPath();ctx.moveTo(-size*.42,-size*.48);ctx.lineTo(0,-size*.7);ctx.lineTo(size*.42,-size*.48);ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,3,size*.48,size*.16,0,0,Math.PI*2);ctx.stroke();
    } else if(theme==='curing_chamber'){
      ctx.setLineDash([3,6]);ctx.beginPath();ctx.arc(0,-size*.16,size*.48,Math.PI*.12,Math.PI*.88);ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,4,size*.5,size*.17,0,0,Math.PI*2);ctx.stroke();
    } else {
      ctx.setLineDash([6,4]);ctx.strokeRect(-size*.48,-size*.52,size*.96,size*.82);
      ctx.beginPath();ctx.moveTo(-size*.58,0);ctx.lineTo(-size*.42,0);ctx.moveTo(size*.42,0);ctx.lineTo(size*.58,0);ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  return drawn;
}

export function industrialContactCell(actor: HazardType | undefined, critical: boolean): number | null {
  const material = actor === 'RUNAWAY_CART' || actor === 'CRANE_BOSS' ? 0 : actor === 'FALLING_DEBRIS' ? 1 : actor === 'GAS_LEAK' ? 2 : null;
  return material === null ? null : material + (critical ? 3 : 0);
}

export function drawIndustrialContact(ctx: CanvasRenderingContext2D, atlas: HTMLImageElement | undefined, event: ProjectileFeedback, age: number, duration: number, reduced: boolean, busy: boolean,metalAtlas?:HTMLImageElement,debrisAtlas?:HTMLImageElement,vaporAtlas?:HTMLImageElement): boolean {
  if(drawAuthoredMetalImpact(ctx,metalAtlas,event,age,duration,reduced,busy))return true;
  if(drawAuthoredDebrisImpact(ctx,debrisAtlas,event,age,duration,reduced,busy))return true;
  if(drawAuthoredVaporImpact(ctx,vaporAtlas,event,age,duration,reduced,busy))return true;
  const cell = industrialContactCell(event.actorKind, Boolean(event.critical));
  if (event.phase !== 'impact' || event.worker || reduced || cell === null || !atlas?.naturalWidth) return false;
  const t = Math.min(1, Math.max(0, age / Math.max(.001, duration)));
  const motion=materialContactMotion(age,duration,event.actorKind==='GAS_LEAK');
  const extent=event.critical?60:40;
  const size = extent * motion.coreScale;
  ctx.save();ctx.rotate(event.angle);
  ctx.globalAlpha = motion.coreAlpha * (busy ? .6 : .95);
  // Each painted contact core is left of center; align it to the engine's hit point.
  const drawn = drawProp(ctx, atlas, cell, size * .18, size * .5, size);
  if(drawn){
    // Sample painted material away from its hot core, then advect each piece independently.
    const gas=event.actorKind==='GAS_LEAK',count=busy?2:event.critical?5:3;
    for(let i=0;i<count;i++){
      const phase=i/(count-1),fragment=materialFragmentMotion(age,duration,gas,i,count);
      const w=extent*(gas?.28:.18)*fragment.scale,h=w*(gas?1.15:.75);
      ctx.save();ctx.translate(fragment.x,fragment.y);
      ctx.rotate(fragment.rotation);ctx.globalAlpha=fragment.alpha*(busy?.4:.72);
      const texture=materialFragmentTexture(atlas,cell,Math.round(phase*4));
      if(texture)ctx.drawImage(texture,-w/2,-h/2,w,h);ctx.restore();
    }
    if(!busy){
      ctx.globalAlpha=motion.tailAlpha;
      const tail=extent*motion.tailScale;
      const texture=materialFragmentTexture(atlas,cell,5);
      if(texture)ctx.drawImage(texture,8,-tail*.28+motion.fragmentFall,tail*.72,tail*.56);
    }
  }
  if(drawn&&!busy){
    const material=event.actorKind==='GAS_LEAK'?'#96e7bb':event.actorKind==='FALLING_DEBRIS'?'#d8c8ad':'#ffd595';
    ctx.strokeStyle=material;ctx.lineWidth=event.critical?2:1.3;
    const count=event.actorKind==='GAS_LEAK'?3:event.critical?6:4;
    for(let i=0;i<count;i++){
      const angle=(i/(count-1)-.5)*1.7,r=5+(1-(1-t)**2)*22,fall=t*t*7;
      ctx.beginPath();ctx.moveTo(Math.cos(angle)*r,Math.sin(angle)*r+fall);
      ctx.lineTo(Math.cos(angle)*(r+5*(1-t)),Math.sin(angle)*(r+5*(1-t))+fall);ctx.stroke();
    }
  }
  ctx.restore();
  return drawn;
}
