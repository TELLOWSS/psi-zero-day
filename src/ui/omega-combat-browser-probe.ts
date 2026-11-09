import type {OmegaProtocolCombatSession} from '../engine/omega-protocol-combat';
import {omegaBladeTargetInArc} from '../domain/omega-protocol-blade';
import {omegaFieldNextRoute} from '../domain/omega-protocol-navigation';
import {omegaFieldScreenMoveToWorld} from '../domain/omega-protocol-field';

/**
 * DEV-ONLY, explicit omegaQaState=combatGun|combatBlade|combatCover|combatRear browser
 * fixture. The mounted React/Canvas screen still runs the genuine WATCH
 * auto-fire, collision, enemy HP and OMEGA blade actions. This sets initial
 * actors/positions exactly once; no synthetic impact, HP mutation *after*
 * entering combat, injected projectile, or production unlock is allowed.
 *
 * This module must never be invoked from ordinary Watch or published OMEGA.
 */
export type OmegaCombatProbeMode='combatGun'|'combatBlade'|'combatCover'|'combatRear';
export interface OmegaCombatProbeFixture{
 readonly mode:OmegaCombatProbeMode;
 readonly zombieId:string;
 readonly initialHp:number;
 readonly coverDetour:boolean;
 readonly gunEnabled:boolean;
}
export function omegaCombatProbeMode(query:string):OmegaCombatProbeMode|null{
 const value=new URLSearchParams(query).get('omegaQaState');
 return value==='combatGun'||value==='combatBlade'||value==='combatCover'||value==='combatRear'?value:null;
}
export function omegaSetupCombatProbe(
 session:OmegaProtocolCombatSession,
 mode:OmegaCombatProbeMode,
):OmegaCombatProbeFixture{
 if(!import.meta.env.DEV)throw new Error('Combat probe must not run outside Vite DEV');
 const state=session.engine.state;
 const field=session.field;
 if(!field||session.run.phase!=='battle')throw new Error('Combat probe needs actual OMEGA world');
 const infected=state.hazards.find(h=>h.type==='UNHELMETED'&&h.hp>0);
 if(!infected)throw new Error('No original infected hard-hat zombie spawned');
 // One real native enemy in each scenario: an ordinary rendered zombie, with
 // large initial HP to survive at least 3 real player-driven sword strikes.
 // No gameplay outcome or damage event is fabricated by this setup.
 state.hazards=[infected];
 infected.speed=0;
 infected.hp=800;
 infected.maxHp=800;
 infected.damage=0;
 state.player.invincibleTime=999;
 state.player.x=mode==='combatCover'?435:150;
 state.player.y=mode==='combatCover'?225:450;
 infected.radius=mode==='combatCover'?40:18;
 infected.x=mode==='combatCover'?530:mode==='combatGun'?360:230;
 infected.y=mode==='combatCover'?320:450;
 const dist=Math.hypot(infected.x-state.player.x,infected.y-state.player.y);
 const route=omegaFieldNextRoute(state.player,infected,field.plan.obstacles);
 const coverDetour=!!route&&route.length>dist+24;
 if(mode==='combatCover'){
  const inArc=omegaBladeTargetInArc(state.player,infected,omegaFieldScreenMoveToWorld(0,1));
  if(!inArc||!coverDetour)throw new Error('Invalid cover fixture: sword must reach an enemy behind the real solid');
 }
 // Disable ONLY the fixture's Watch gun when verifying pure sword damage;
 // default gameplay always keeps its actual original auto-fire perk.
 if(mode==='combatBlade'||mode==='combatRear')state.activePerks.radio_boost=0;
 return {mode,zombieId:infected.id,initialHp:800,coverDetour,
  gunEnabled:state.activePerks.radio_boost>0};
}
