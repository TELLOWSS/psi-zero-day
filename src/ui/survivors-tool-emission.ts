import type {SurvivorsGameState,Projectile} from '../domain/patrol-survivors';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import type {SpritePose} from './survivors-sprite-motion';
import {carriedTool} from './survivors-carried-equipment';
import {baseToolSocket} from './survivors-wearable-art';
import {actorTorsoPoint} from './survivors-rig-renderer';
import {ACTOR_RIGS} from './survivors-animation-rig';
type Point=Readonly<{x:number;y:number}>;

export function radioToolOffset(state:Readonly<SurvivorsGameState>,actor:HTMLImageElement|undefined,height:number,pose:SpritePose):Point|undefined {
 if(!actor?.naturalWidth||!state.premiumGear?.equipped.includes('voice_lens')||carriedTool(state)?.id!=='radio_boost')return;
 const socket=baseToolSocket(state.characterId,actor,height,false,pose);if(!socket)return;
 return actorTorsoPoint(socket,pose,height,Boolean(ACTOR_RIGS[actor.src.split('/').pop()??'']));
}

/** A shot keeps its launch-time body projection; engine coordinates stay untouched. */
export class RadioEmissionProjection {
 private run?:Readonly<SurvivorsGameState>;
 private offsets=new Map<string,Point>();
 get size():number{return this.offsets.size;}
 offset(id:string):Point|undefined{return this.offsets.get(id);}
 observe(state:Readonly<SurvivorsGameState>,events:readonly ProjectileFeedback[],offset:Point|undefined):void {
  if(this.run!==state){this.run=state;this.offsets.clear();}
  const live=new Set(state.projectiles.map(p=>p.id));
  for(const event of events)live.add(event.projectileId);
  for(const id of this.offsets.keys())if(!live.has(id))this.offsets.delete(id);
  if(!offset)return;
  for(const event of events){
   if(event.kind!=='radio'||event.phase!=='launch'||event.worker||event.blocked)continue;
   if(this.offsets.size>=128&&!this.offsets.has(event.projectileId))continue;
   this.offsets.set(event.projectileId,{x:offset.x,y:offset.y});
  }
 }
 feedback(event:ProjectileFeedback):ProjectileFeedback {
  const offset=this.offsets.get(event.projectileId);
  return event.kind==='radio'&&!event.worker&&!event.blocked&&offset?
   {...event,x:event.x+offset.x,y:event.y+offset.y}:event;
 }
 flightOffset(projectile:Readonly<Projectile>):Point|undefined {
  return projectile.kind==='radio'?this.offsets.get(projectile.id):undefined;
 }
}
