/** Neutral rendering/audio contract. Never imports WATCH state or owns physics. */
export interface BreakerEventInput {kind:string;x:number;y:number;t:number;n?:number;material?:string|null;weapon?:string;level?:number;equipmentTier?:number;recipe?:string;element?:string;cooldown?:number;sourceId?:string;nx?:number;ny?:number;vx?:number;vy?:number}
export interface BreakerPresentationEvent extends BreakerEventInput {
 type:string;position:{x:number;y:number};normal?:{x:number;y:number};outgoingVelocity?:{x:number;y:number};simulationTime:number;weaponStage:number;intensity:number;
}
export function presentationEvent(event:BreakerEventInput):BreakerPresentationEvent {
 return {...event,type:event.kind,position:{x:event.x,y:event.y},
  normal:event.nx!==undefined&&event.ny!==undefined?{x:event.nx,y:event.ny}:undefined,
  outgoingVelocity:event.vx!==undefined&&event.vy!==undefined?{x:event.vx,y:event.vy}:undefined,
  simulationTime:event.t,weaponStage:event.equipmentTier===undefined?Math.max(1,Math.min(3,event.level??1)):Math.max(1,Math.min(4,event.equipmentTier)),
  intensity:event.kind==='fire'?.35+.2*((event.level??1)-1):event.kind==='boss'?1:.6};
}
