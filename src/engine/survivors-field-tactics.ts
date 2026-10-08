import type { SurvivorsGameState } from '../domain/patrol-survivors';
import type { FieldTactics } from '../domain/survivors-field-tactics';
import {terrainContains} from './survivors-terrain';
export const createFieldTactics=():FieldTactics=>({supportCharges:2,supportCooldown:0,lineCharges:2,lineCooldown:0,lines:[]});
export function requestFieldSupport(state:SurvivorsGameState):boolean {
 const t=state.fieldTactics;
 if(state.phase!=='playing'||state.bossEncounter&&state.bossEncounter.phase!=='combat'||!t||t.supportCharges<=0||t.supportCooldown>0||t.pendingSupport)return false;
 t.supportCharges--;t.supportCooldown=30;t.pendingSupport={x:state.player.x,y:state.player.y,remaining:1.2};return true;
}
export function placeControlLine(state:SurvivorsGameState):boolean {
 const t=state.fieldTactics;
 if(state.phase!=='playing'||state.bossEncounter&&state.bossEncounter.phase!=='combat'||!t||t.lineCharges<=0||t.lineCooldown>0)return false;
 if(state.terrain?.some(o=>terrainContains(o,state.player,16)))return false;
 t.lineCharges--;t.lineCooldown=8;t.lines.push({x:state.player.x,y:state.player.y,radius:110,remaining:10});return true;
}
/** Existing safety objects keep their warning clocks; utility affects approach speed only. */
export function controlLineSpeed(state:SurvivorsGameState,x:number,y:number,type:string):number {
 if(type!=='RUNAWAY_CART'&&type!=='GAS_LEAK')return 1;
 return state.fieldTactics?.lines.some(line=>Math.hypot(x-line.x,y-line.y)<=line.radius)?.65:1;
}
export function tickFieldTactics(state:SurvivorsGameState,dt:number,spawnSupply:(x:number,y:number)=>void):void {
 const t=state.fieldTactics;if(!t||state.phase!=='playing')return;
 t.supportCooldown=Math.max(0,t.supportCooldown-dt);t.lineCooldown=Math.max(0,t.lineCooldown-dt);
 t.lines=t.lines.filter(line=>{line.remaining-=dt;return line.remaining>0;});
 if(t.pendingSupport){t.pendingSupport.remaining-=dt;if(t.pendingSupport.remaining<=0){spawnSupply(t.pendingSupport.x,t.pendingSupport.y);t.pendingSupport=undefined;}}
 if(t.handoff){
  if(Math.hypot(state.player.x-t.handoff.x,state.player.y-t.handoff.y)>72)t.handoff=undefined;
  else t.handoff.remaining=Math.max(0,t.handoff.remaining-dt);
 }
}
