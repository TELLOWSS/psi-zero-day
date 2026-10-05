import type {Hazard,SurvivorsGameState} from '../domain/patrol-survivors';
import {bossCoreStatus} from '../engine/survivors-boss-pattern';
import {drawVfxCell} from './survivors-cinematic-vfx';
import {drawProp} from './survivors-equipment-art';
import {industrialHazardPlacement,craneAttackElevation} from './survivors-industrial-art';
import {debrisElevation} from './survivors-animation-rig';

export function bossPresentationPose(state:Readonly<SurvivorsGameState>,boss:Readonly<Hazard>,reduced:boolean,busy:boolean){
 const encounter=state.bossEncounter;
 if(!encounter||encounter.bossId!==boss.id||!boss.isStageBoss||boss.type==='UNHELMETED')return null;
 const phase=encounter.phase==='combat'?bossCoreStatus(boss):encounter.phase;
 // Never paint a second footprint over a locked danger trajectory.
 if(phase==='active'||encounter.phase==='combat'&&['warning','charge','fall'].includes(boss.motion?.phase??''))return null;
 const progress=phase==='arrival'?Math.max(0,Math.min(1,1-encounter.remaining/3.5)):phase==='secured'?Math.max(0,Math.min(1,1-encounter.remaining/2.4)):0;
 const pulse=reduced?0:Math.sin(state.gameTime*2.4)*.04;
 const expansion=reduced?1:phase==='arrival'?.8+(1-(1-progress)**3)*.2:phase==='secured'?1+progress*.12:1+pulse;
 return {phase,progress,width:Math.min(106,Math.max(64,boss.radius*1.6))*expansion,
  alpha:(busy?.22:.38)*(phase==='secured'?1-progress:1),cell:phase==='interlocked'?3:phase==='exposed'?1:7,
  rotation:reduced?0:phase==='arrival'?(1-progress)*.25:phase==='exposed'?Math.sin(state.gameTime*1.8)*.10:0,
  artAlpha:phase==='secured'?Math.max(0,1-progress*1.3):0,settle:reduced?0:Math.min(1,progress*4)*3};
}

/** One copied boss, owned by presentation. It cannot stay alive or grant rewards. */
export class BossEncounterDirection {
 private snapshot:Hazard|undefined;
 observe(state:Readonly<SurvivorsGameState>):void {
  const encounter=state.bossEncounter;
  if(!encounter){this.snapshot=undefined;return;}
  if(this.snapshot?.id!==encounter.bossId)this.snapshot=undefined;
  const boss=state.hazards.find(h=>h.id===encounter.bossId&&h.isStageBoss&&h.type!=='UNHELMETED'&&h.hp>0);
  if(boss)this.snapshot={...boss,motion:boss.motion?{...boss.motion}:undefined};
 }
 draw(ctx:CanvasRenderingContext2D,state:Readonly<SurvivorsGameState>,atlas:HTMLImageElement|undefined,images:Partial<Record<Hazard['type'],HTMLImageElement>>,reduced:boolean,busy:boolean):void {
  const boss=this.snapshot;if(!boss)return;
  const pose=bossPresentationPose(state,boss,reduced,busy);if(!pose)return;
  ctx.save();ctx.translate(boss.x,boss.y);
  ctx.globalCompositeOperation='screen';
  drawVfxCell(ctx,atlas,pose.cell,0,4,pose.width,pose.width*.38,pose.alpha,pose.rotation);
  if(!reduced&&!busy&&pose.phase==='exposed')drawVfxCell(ctx,atlas,1,0,-12,30,24,.20+Math.sin(state.gameTime*2.4)*.03);
  ctx.globalCompositeOperation='source-over';
  const image=images[boss.type];
  if(pose.phase==='secured'&&image?.naturalWidth){
   ctx.globalAlpha=pose.artAlpha;
   const size=boss.type==='CRANE_BOSS'?Math.min(220,Math.max(112,boss.radius*2.7)):industrialHazardPlacement(boss,0,true).size;
   const elevation=boss.type==='CRANE_BOSS'?craneAttackElevation(boss,reduced):boss.type==='FALLING_DEBRIS'?debrisElevation(boss.motion?.phase??'fall',boss.motion?.timer??0):0;
   const lowering=reduced?0:1-(1-Math.min(1,pose.progress*2))**3;
   const bottom=(boss.type==='CRANE_BOSS'?16:0)-elevation*(1-lowering)+pose.settle;
   if(boss.type==='RUNAWAY_CART'&&(boss.motion?.directionX??0)<-.04)ctx.scale(-1,1);
   drawProp(ctx,image,0,0,bottom,size);
  }
  ctx.restore();
 }
}
