import type {Hazard,SurvivorsGameState} from '../domain/patrol-survivors';
import {premiumHazardSpeed} from '../engine/survivors-premium-gear';
export type InspectionPhase = 'docked'|'launching'|'inspecting'|'returning';
export interface InspectionFlight {phase:InspectionPhase;x:number;y:number;targetId?:string}
interface Sample extends InspectionFlight {clock:number;elapsed:number;from:{x:number;y:number}}
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const ease=(t:number)=>t*t*(3-2*t);
/** Only hazards currently affected by the real suppression rule are presentation targets. */
export function inspectionTarget(state:SurvivorsGameState,preferred?:string):Hazard|undefined {
  if(!state.premiumGear?.equipped.includes('inspection_wing'))return;
  const eligible=state.hazards.filter(h=>h.hp>0&&premiumHazardSpeed(state,h)<1);
  const retained=eligible.find(h=>h.id===preferred);if(retained)return retained;
  return eligible.reduce<Hazard|undefined>((best,h)=>!best||Math.hypot(h.x-state.player.x,h.y-state.player.y)<Math.hypot(best.x-state.player.x,best.y-state.player.y)?h:best,undefined);
}
/** Relative offsets retain the companion's tether while the actor moves. No engine state is written. */
export class InspectionFlightTracker {
  private samples=new WeakMap<SurvivorsGameState,Sample>();
  sample(state:SurvivorsGameState,dock:{x:number;y:number},reducedMotion=false):InspectionFlight {
    let previous=this.samples.get(state);
    if(!previous||state.gameTime<previous.clock||!state.premiumGear?.equipped.includes('inspection_wing')) {
      previous={phase:'docked',...dock,clock:state.gameTime,elapsed:0,from:{...dock}};
    }
    if(state.phase!=='playing') {this.samples.set(state,previous);return {...previous};}
    const target=inspectionTarget(state,previous.targetId);
    const destination=target?{x:target.x-state.player.x-14,y:target.y-state.player.y-28}:dock;
    const dt=Math.min(.25,Math.max(0,state.gameTime-previous.clock));
    let next:Sample={...previous,clock:state.gameTime};
    if(reducedMotion) next={...next,phase:target?'inspecting':'docked',...destination,targetId:target?.id,elapsed:0};
    else {
      if(previous.phase==='docked') {
        next={...next,...dock};
        if(target)next={...next,phase:'launching',targetId:target.id,elapsed:0,from:{...dock}};
      }else if((previous.phase==='launching'||previous.phase==='inspecting')&&!target) {
        next={...next,phase:'returning',targetId:undefined,elapsed:0,from:{x:previous.x,y:previous.y}};
      }
      if(next.phase==='launching'||next.phase==='returning') {
        next.elapsed+=dt;
        const returning=next.phase==='returning',progress=Math.min(1,next.elapsed/(returning?.45:.35));
        const goal=returning?dock:destination,t=ease(progress);
        next.x=mix(next.from.x,goal.x,t);next.y=mix(next.from.y,goal.y,t);
        if(progress===1)next={...next,phase:returning?'docked':'inspecting',targetId:returning?undefined:target?.id,elapsed:0};
      }else if(next.phase==='inspecting') {
        const t=1-Math.exp(-dt*10);
        next={...next,x:mix(next.x,destination.x,t),y:mix(next.y,destination.y,t),targetId:target?.id};
      }
    }
    this.samples.set(state,next);return {phase:next.phase,x:next.x,y:next.y,targetId:next.targetId};
  }
}
