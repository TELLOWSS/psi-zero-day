import crops from '../../content/art/survivors-workface-crops-v1.json';
import roster from '../../content/art/survivors-workface-threats-v1.json';
import copy from '../../content/localization/survivors-workface-threats-ko.json';
import type {Hazard} from '../domain/patrol-survivors';
import type {SpritePose} from './survivors-sprite-motion';
import {registerPropAtlas} from './survivors-equipment-art';
export const WORKFACE_THREATS=roster.stages;
export const WORKFACE_CROPS=crops;
export const WORKFACE_GRID={columns:roster.columns,rows:roster.rows};
export function workfaceThreat(stageNumber:number) {const row=WORKFACE_THREATS[stageNumber-1];return row?.stage===stageNumber?row:undefined;}
export function workfaceThreatCopy(stageNumber:number) {const row=workfaceThreat(stageNumber);return row?copy.stages[row.id as keyof typeof copy.stages]:undefined;}
/** Two thirds use the new workface identity; existing material variants remain in the mix. */
export function workfaceThreatAppearance(h:Pick<Hazard,'type'|'id'|'isStageBoss'|'signatureEventId'>,stageNumber:number) {
 if(h.isStageBoss||h.signatureEventId)return undefined;
 const row=workfaceThreat(stageNumber);if(!row||row.type!==h.type)return undefined;
 const sequence=Number(h.id.split('_').at(-1));
 return Number.isFinite(sequence)&&sequence%3===0?undefined:row;
}
/** Art-only articulation, anchored to the engine's locked movement and landing point. */
export function workfaceThreatPose(h:Pick<Hazard,'motion'|'type'|'id'>,pose:Pick<SpritePose,'moving'|'speed'|'travel'>,clock:number,reduced:boolean) {
 const neutral={x:0,y:0,rotation:0,scaleX:1,scaleY:1};if(reduced)return neutral;
 const seed=Number(h.id.split('_').at(-1))||0;
 if(h.type==='RUNAWAY_CART'){
  const moving=pose.moving&&h.motion?.phase!=='warning'&&h.motion?.phase!=='cooldown';
  const amplitude=moving?Math.min(.8,Math.max(0,pose.speed)/240):0;
  return {...neutral,y:Math.sin(pose.travel*.13+seed)*amplitude,rotation:Math.sin(pose.travel*.08+seed)*amplitude*.012};
 }
 if(h.type==='GAS_LEAK')return {...neutral,y:Math.sin(clock*1.4+seed)*1.1,rotation:Math.sin(clock*.9+seed)*.018,scaleX:1+Math.sin(clock*1.1+seed)*.025,scaleY:1+Math.cos(clock*1.3+seed)*.022};
 if(h.type==='FALLING_DEBRIS'&&h.motion?.phase==='fall'){
  const fall=Math.max(0,Math.min(1,1-h.motion.timer/.45));
  return {...neutral,rotation:Math.sin(fall*Math.PI)*.14*(seed%2?-1:1)};
 }
 return neutral;
}
/** At most two regional atlases cached; each request scans/crops alpha only once. */
export class WorkfaceThreatArt {
 private images=new Map<string,HTMLImageElement>();
 private pending=new Set<string>();
 get(stageNumber:number):HTMLImageElement|undefined {
  const row=workfaceThreat(stageNumber);if(!row)return undefined;
  const cached=this.images.get(row.atlas);if(cached){this.images.delete(row.atlas);this.images.set(row.atlas,cached);return cached;}
  if(!this.pending.has(row.atlas)){
   this.pending.add(row.atlas);const image=new Image();
   image.onload=()=>{registerPropAtlas(image,WORKFACE_GRID.columns,WORKFACE_GRID.rows,WORKFACE_CROPS[row.atlas as keyof typeof WORKFACE_CROPS]);this.images.set(row.atlas,image);this.pending.delete(row.atlas);while(this.images.size>2)this.images.delete(this.images.keys().next().value!);};
   image.onerror=()=>{/* Keep legacy production art; no repeated per-frame retries. */};
   image.src='/assets/survivors/'+row.atlas;
  }
  return undefined;
 }
}
