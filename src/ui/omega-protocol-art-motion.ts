/**
 * Presentation-only AIRA 8x20 action selector from ACTUAL Watch state.
 * Makes no changes to combat cooldowns, hit boxes, movement or rewards.
 */
export interface OmegaNativeActionSample {
 readonly gameTime:number;
 readonly runPhase:string;
 readonly enginePhase:string;
 readonly directorShoutTimer:number;
 readonly isDashing:boolean;
 readonly dashRemaining:number;
 readonly hurtRemaining:number;
 readonly fireUntil:number;
 /** Victory animation age from run-local render clock (not frozen gameTime). */
 readonly terminalElapsed?:number;
}
export type OmegaArtAction='walk'|'fire'|'dash'|'hit'|'ultimate'|'finish';
export interface OmegaArtActionFrame {
 readonly action:OmegaArtAction;
 readonly shooting:boolean;
 readonly dashing:boolean;
 readonly hurt:boolean;
 readonly ultimate:boolean;
 readonly finished:boolean;
 readonly actionAge:number;
}
const shotDuration=.09;
const shotFinishHold=.075;
const duration=(value:number,max:number)=>Number.isFinite(value)?Math.max(0,Math.min(max,value)):0;
/** Prioritize terminal/victory and native shout before other native action cues.
 * A currently sounding shout (2s Watch timer) cannot be manufactured by
 * inspecting an ultimate meter or from a local UI button pressed too early.
 */
export function omegaResolveArtAction(sample:OmegaNativeActionSample):OmegaArtActionFrame {
 const gameTime=sample.gameTime;
 const valid=Number.isFinite(gameTime)&&gameTime>=0;
 const victory=sample.runPhase==='victory';
 const active=valid&&sample.runPhase==='battle'&&sample.enginePhase==='playing';
 const ultimate=active&&Number.isFinite(sample.directorShoutTimer)&&sample.directorShoutTimer>0;
 const hurt=active&&Number.isFinite(sample.hurtRemaining)&&sample.hurtRemaining>1.85;
 const dash=active&&sample.isDashing&&Number.isFinite(sample.dashRemaining)&&sample.dashRemaining>0;
 const shot=active&&Number.isFinite(sample.fireUntil)&&sample.fireUntil>0&&
  gameTime<sample.fireUntil+shotFinishHold&&
  gameTime>=sample.fireUntil-shotDuration-0.005;
 const action:OmegaArtAction=victory?'finish':ultimate?'ultimate':hurt?'hit':dash?'dash':shot?'fire':'walk';
 const start=action==='ultimate'?2-duration(sample.directorShoutTimer,2):
  action==='hit'?2-duration(sample.hurtRemaining,2):
  action==='dash'?.22-duration(sample.dashRemaining,.22):
  action==='fire'?Math.max(0,gameTime-(sample.fireUntil-shotDuration)):
  action==='finish'?duration(sample.terminalElapsed??0,1):0;
 return {action,shooting:action==='fire',dashing:action==='dash',
  hurt:action==='hit',ultimate:action==='ultimate',finished:action==='finish',
  actionAge:Math.max(0,start)};
}

/**
 * Watch gameTime freezes after the final node. A terminal pose would remain
 * forever on its first or last frame if driven by frozen simulation time.
 * Use a per-session requestAnimationFrame clock ONLY for visual animation.
 * This never advances enemies, physics, cooldowns or completion rewards.
 */
export class OmegaTerminalMotionClock {
 private phaseStart:number|null=null;
 private lastTime:number|null=null;
 reset():void {this.phaseStart=null;this.lastTime=null;}
 advance(runPhase:string,frameTimeSeconds:number):number{
  if(runPhase!=='victory'){this.reset();return 0;}
  if(!Number.isFinite(frameTimeSeconds)||frameTimeSeconds<0)return 0;
  if(this.phaseStart===null||(this.lastTime!==null&&frameTimeSeconds<this.lastTime)){
   this.phaseStart=frameTimeSeconds;
  }
  this.lastTime=frameTimeSeconds;
  return Math.min(1,Math.max(0,frameTimeSeconds-this.phaseStart));
 }
}
