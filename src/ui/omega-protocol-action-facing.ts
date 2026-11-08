import type {OmegaActorFireCue} from './omega-protocol-actor-cues';

export interface OmegaFacingVector { readonly x:number;readonly y:number }
export interface OmegaActorDirectionPose {
 readonly bodyX:number; readonly bodyY:number;
 readonly weaponX:number; readonly weaponY:number;
 readonly shooting:boolean;
 readonly headingIndex:number;
}
export interface OmegaFacingAction {
 readonly dashing:boolean;
 readonly hurting:boolean;
 readonly playing:boolean;
}
const QUARTER=Math.PI/4,MAX_TURN_RADIANS_PER_SECOND=9;
const HYSTERESIS=.12;
const normalize=(v:OmegaFacingVector):OmegaFacingVector|null=>{
 if(!Number.isFinite(v.x)||!Number.isFinite(v.y))return null;
 const n=Math.hypot(v.x,v.y);
 return n>1e-7?{x:v.x/n,y:v.y/n}:null;
};
const wrap=(radians:number)=>Math.atan2(Math.sin(radians),Math.cos(radians));
const asIndex=(a:number)=>((Math.round(a/QUARTER)%8)+8)%8;
/**
 * Real player movement determines the facing target; genuine shot feedback
 * temporarily supplies a separate exact weapon bearing. Character body
 * turns with a bounded angular rate and 8-way hysteresis. A real dash or
 * hit reaction locks the last body heading, without affecting Watch physics.
 */
export class OmegaActorFacingController{
 private angle:number|null=null;
 private index=2; // down / south
 private lastTime:number|null=null;
 private wasLocked=false;
 reset():void{
  this.angle=null;this.index=2;this.lastTime=null;this.wasLocked=false;
 }
 advance(
  gameTime:number,requested:OmegaFacingVector,
  fire:OmegaActorFireCue,action:OmegaFacingAction,
 ):OmegaActorDirectionPose{
  if(!Number.isFinite(gameTime)||gameTime<0){
   this.reset();return this.snapshot(false,{x:0,y:1});
  }
  if(this.lastTime!==null&&gameTime<this.lastTime-1e-6)this.reset();
  const dt=this.lastTime===null?0:Math.min(.05,Math.max(0,gameTime-this.lastTime));
  this.lastTime=gameTime;
  const shot=action.playing&&Number.isFinite(fire.until)&&
   fire.until>gameTime&&gameTime>=0;
  const fireDir=shot?normalize({x:fire.screenX,y:fire.screenY}):null;
  const moveDir=normalize(requested);
  const desired=fireDir??moveDir;
  const locked=action.dashing||action.hurting||!action.playing;
  // A scripted dash cannot redirect the body to a newly auto-acquired enemy.
  // The muzzle still follows actual native projectiles while firing.
  if(this.angle===null){
   const initial=moveDir??{x:0,y:1};
   this.angle=Math.atan2(initial.y,initial.x);
   this.index=asIndex(this.angle);
  }
  if(!locked&&desired){
   const target=Math.atan2(desired.y,desired.x);
   const delta=wrap(target-this.angle);
   // A dash release or damage recovery never teleports across 180 degrees.
   // Large dt is clamped to avoid background tab wake-up snapping.
   const maxChange=MAX_TURN_RADIANS_PER_SECOND*dt;
   this.angle=wrap(this.angle+Math.max(-maxChange,Math.min(maxChange,delta)));
   const center=this.index*QUARTER;
   if(Math.abs(wrap(this.angle-center))>QUARTER/2+HYSTERESIS)
    this.index=asIndex(this.angle);
  }
  this.wasLocked=locked;
  return this.snapshot(shot,fireDir??{x:Math.cos(this.angle),y:Math.sin(this.angle)});
 }
 private snapshot(shooting:boolean,aim:OmegaFacingVector):OmegaActorDirectionPose{
  const heading=this.index*QUARTER;
  return {bodyX:Math.cos(heading),bodyY:Math.sin(heading),
   weaponX:aim.x,weaponY:aim.y,shooting,headingIndex:this.index};
 }
}
