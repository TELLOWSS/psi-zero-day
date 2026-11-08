/**
 * Display-only AIRA footsteps. All gait motion is advanced from Watch's
 * POST-COLLISION player world position, not elapsed render time or joystick
 * intent. This does not modify speed, hitboxes, rewards or game state.
 * Procedural technical geometry: NOT approved 160-frame character art.
 */
export interface OmegaWalkPoint {readonly x:number;readonly y:number}
export interface OmegaWalkFoot {
 readonly x:number;readonly y:number;readonly planted:boolean;
 /** Exactly one visual sample when the swing foot meets ground. */
 readonly landed?:boolean;
}
export interface OmegaWalkPose {
 readonly active:boolean;
 readonly phase:number;
 readonly distanceTravelled:number;
 readonly left:OmegaWalkFoot;
 readonly right:OmegaWalkFoot;
}
type MutableFoot={
 anchor:OmegaWalkPoint;
 last:OmegaWalkPoint;
 swingStart:OmegaWalkPoint;
 planted:boolean;
 initialized:boolean;
};
// A planted stance cannot exceed the visible operator's 33px leg reach.
// 48 projected units/cycle × .55 stance = 26.4 units of hip travel.
const cycleDistance=48;
const stancePortion=.55;
const projected=(p:OmegaWalkPoint):OmegaWalkPoint=>({x:p.x-.22*p.y,y:p.y*.78});
const length=(a:OmegaWalkPoint,b:OmegaWalkPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
const lerp=(a:number,b:number,f:number)=>a+(b-a)*f;
const blank=(x:number):OmegaWalkFoot=>({x,y:0,planted:true});
const idle=():OmegaWalkPose=>({active:false,phase:0,distanceTravelled:0,left:blank(-9),right:blank(9)});
const makeFoot=():MutableFoot=>({
 anchor:{x:0,y:0},last:{x:0,y:0},swingStart:{x:0,y:0},
 planted:false,initialized:false,
});
/** Per-session, visual-only foot-contact track. No global mutable cache. */
export class OmegaGroundedGait {
 private lastWorld:OmegaWalkPoint|null=null;
 private lastTime:number|null=null;
 private lastNode:number|null=null;
 private lastMoveAt:number|null=null;
 private lastPose:OmegaWalkPose|null=null;
 private phase=0;
 private distanceTotal=0;
 private left=makeFoot();
 private right=makeFoot();
 reset():void{
  this.lastWorld=null;this.lastTime=null;this.lastNode=null;
  this.phase=0;this.distanceTotal=0;
  this.lastMoveAt=null;this.lastPose=null;
  this.left=makeFoot();this.right=makeFoot();
 }
 advance(world:OmegaWalkPoint,gameTime:number,node:number,dashing=false):OmegaWalkPose{
  if(!Number.isFinite(world.x)||!Number.isFinite(world.y)||
   !Number.isFinite(gameTime)||gameTime<0||!Number.isSafeInteger(node)){
   this.reset();return idle();
  }
  if(this.lastWorld===null||this.lastTime===null||node!==this.lastNode||
   gameTime<this.lastTime-1e-6){
   this.reset();this.lastWorld={...world};this.lastTime=gameTime;this.lastNode=node;
   return idle();
  }
  const current=projected(world),prior=projected(this.lastWorld);
  const dist=length(current,prior),elapsed=gameTime-this.lastTime;
  this.lastWorld={...world};this.lastTime=gameTime;
  // Transition teleport cannot trigger a sprint pose or planted-foot streak.
  if(dist>96){
   this.reset();this.lastWorld={...world};this.lastTime=gameTime;this.lastNode=node;
   return idle();
  }
  if(dashing||dist<.04||elapsed<=0){
   if(dashing){
    this.left=makeFoot();this.right=makeFoot();
    this.lastPose=null;this.lastMoveAt=null;
   }
   // 120Hz visual rendering may see two frames for every 60Hz physics step.
   // Hold the SAME planted pose <=60ms, without advancing its walk phase.
   // Prolonged wall collision returns to idle (no running on the spot).
   if(!dashing&&this.lastMoveAt!==null&&this.lastPose&&
    gameTime-this.lastMoveAt<=.06){
    // Retain the same stance pose at 120Hz, but landing is an EVENT and
    // must never be replayed during a physics frame with zero displacement.
    return {...this.lastPose,
     left:{...this.lastPose.left,landed:false},
     right:{...this.lastPose.right,landed:false}};
   }
   return {active:false,phase:this.phase,distanceTravelled:this.distanceTotal,
    left:blank(-9),right:blank(9)};
  }
  const heading={x:(current.x-prior.x)/dist,y:(current.y-prior.y)/dist};
  this.phase=(this.phase+dist/cycleDistance)%1;
  this.distanceTotal+=dist;
  const left=this.foot(this.left,current,heading,this.phase,-9);
  const right=this.foot(this.right,current,heading,(this.phase+.5)%1,9);
  this.lastMoveAt=gameTime;
  this.lastPose={active:true,phase:this.phase,distanceTravelled:this.distanceTotal,left,right};
  return this.lastPose;
 }
 private foot(state:MutableFoot,root:OmegaWalkPoint,heading:OmegaWalkPoint,
  phase:number,side:number):OmegaWalkFoot{
  const stance=phase<stancePortion;
  const lateral={x:side,y:0};
  if(!state.initialized){
   const world={x:root.x+lateral.x,y:root.y};
   state.anchor=world;state.last=world;state.swingStart=world;
   state.initialized=true;state.planted=stance;
  }
  if(stance){
   const landed=!state.planted;
   if(landed)state.anchor=state.last;
   state.planted=true;state.last=state.anchor;
   return {x:state.anchor.x-root.x,y:state.anchor.y-root.y,planted:true,
    landed};
  }
  if(state.planted)state.swingStart=state.last;
  state.planted=false;
  const t=Math.min(1,Math.max(0,(phase-stancePortion)/(1-stancePortion)));
  const eased=t*t*(3-2*t);
  const next={x:root.x+lateral.x+heading.x*16,y:root.y+heading.y*16};
  const world={x:lerp(state.swingStart.x,next.x,eased),
   y:lerp(state.swingStart.y,next.y,eased)};
  state.last=world;
  return {x:world.x-root.x,y:world.y-root.y-7*Math.sin(Math.PI*t),planted:false};
 }
}
