import type {SpritePose} from './survivors-sprite-motion';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';

/**
 * REAL native SIGNAL WATCH action-state sampler for the silver AIRA source.
 * This reports what the existing physics/combat engine ACTUALLY did.
 * It does not claim that any of these actions have independently painted
 * silver/white animation frames or change engine physics, damage or saves.
 */
export type OmegaSilverWatchNativeAction='idle'|'walk'|'fire'|'dash'|'hit';
export type OmegaSilverActionArtProvenance='neutral-original-only';
export interface OmegaSilverWatchNativeActionState{
 readonly action:OmegaSilverWatchNativeAction;
 readonly age:number;
 readonly art:OmegaSilverActionArtProvenance;
}
export interface OmegaSilverWatchNativeActionInput{
 readonly time:number;
 readonly phase:string;
 readonly pose:Pick<SpritePose,'moving'|'reaction'>;
 readonly dashing:boolean;
 readonly playerX:number;
 readonly playerY:number;
 readonly projectiles:readonly Pick<ProjectileFeedback,'phase'|'kind'|'x'|'y'>[];
}
const FIRE_HOLD_SECONDS=.145;
const PLAYER_LAUNCH_RADIUS=60;
function nativeHandheldLaunch(
 projectiles:OmegaSilverWatchNativeActionInput['projectiles'],
 x:number,y:number,
):boolean{
 return projectiles.some(p=>
  p.phase==='launch'&&(p.kind==='radio'||p.kind==='grout_slug')&&
  Number.isFinite(p.x)&&Number.isFinite(p.y)&&
  Math.hypot(p.x-x,p.y-y)<=PLAYER_LAUNCH_RADIUS);
}
export class OmegaSilverWatchNativeActionTracker{
 private lastTime=0;
 private fireStart=-Infinity;
 private dashStart=-Infinity;
 private hitStart=-Infinity;
 reset():void{
  this.lastTime=0;
  this.fireStart=-Infinity;
  this.dashStart=-Infinity;
  this.hitStart=-Infinity;
 }
 sample(input:OmegaSilverWatchNativeActionInput):OmegaSilverWatchNativeActionState{
  const time=input.time;
  if(!Number.isFinite(time)||time<0){
   this.reset();
   return {action:'idle',age:0,art:'neutral-original-only'};
  }
  if(time<this.lastTime)this.reset(); // Retry/engine swap invalidates old cues.
  this.lastTime=time;
  if(input.phase!=='playing'){
   this.fireStart=-Infinity;
   this.dashStart=-Infinity;
   this.hitStart=-Infinity;
   return {action:'idle',age:0,art:'neutral-original-only'};
  }
  if(Number.isFinite(input.playerX)&&Number.isFinite(input.playerY)&&
     nativeHandheldLaunch(input.projectiles,input.playerX,input.playerY))
   this.fireStart=time;
  const hurt=Number.isFinite(input.pose.reaction)&&input.pose.reaction>0;
  const dash=input.dashing;
  if(dash&&this.dashStart===-Infinity)this.dashStart=time;
  if(!dash)this.dashStart=-Infinity;
  if(hurt&&this.hitStart===-Infinity)this.hitStart=time;
  if(!hurt)this.hitStart=-Infinity;
  const action:OmegaSilverWatchNativeAction=hurt?'hit':dash?'dash':
   Number.isFinite(this.fireStart)&&time>=this.fireStart&&
   time-this.fireStart<FIRE_HOLD_SECONDS?'fire':
   input.pose.moving?'walk':'idle';
  const start=action==='hit'?this.hitStart:
   action==='dash'?this.dashStart:
   action==='fire'?this.fireStart:time;
  return {
   action,
   age:Number.isFinite(start)?Math.max(0,time-start):0,
   art:'neutral-original-only',
  };
 }
}
