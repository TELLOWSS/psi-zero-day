import {
 SurvivorsEngine,createInitialSurvivorsState,DEFAULT_PERMANENT_UPGRADES,
 type GameInput,PERK_CATALOG,
} from './patrol-survivors-engine';
import type {PerkId,HazardType} from '../domain/patrol-survivors';
import {
 omegaProtocolAccess,omegaStartRun,omegaWavePlan,omegaResolveBattle,omegaChooseUpgrade,omegaSeedHash,
 type OmegaProtocolRun,type OmegaUpgradeId,type OmegaWavePlan,
} from '../domain/omega-protocol-run';

export interface OmegaCombatSnapshot {
 readonly run:OmegaProtocolRun;
 readonly plan:OmegaWavePlan;
 readonly enemiesAlive:number;
 readonly enginePhase:string;
 readonly playerHp:number;
 readonly playerX:number;
 readonly playerY:number;
 readonly armed:boolean;
}
export const OMEGA_MAX_LIVE_THREATS=15;

/**
 * Actual Signal Watch simulation, projectiles, movement, dash and collisions;
 * only spawn scheduling, card-choice and stage settlement are replaced.
 * Does not write to localStorage or any account/premium/permanent store.
 */
export class OmegaProtocolCombatSession {
 readonly engine:SurvivorsEngine;
 private active:OmegaProtocolRun;
 private latestPlan:OmegaWavePlan;
 private armed=false;
 constructor(
  seed:number,watchClears:number,masterCosmeticEligible=false,
 ){
  const access=omegaProtocolAccess(watchClears,masterCosmeticEligible);
  const run=omegaStartRun(seed,access);
  if(!run)throw new Error('Complete 10 Watch stages before entering OMEGA PROTOCOL');
  this.active=run;
  // Isolated zero-upgrade base character with no premium or operation handoff.
  const state=createInitialSurvivorsState('player',{...DEFAULT_PERMANENT_UPGRADES},
   'stage_01','standard',{owned:[],equipped:[]},[]);
  this.engine=new SurvivorsEngine(state,run.seed);
  this.engine.enableProtocolEncounter();
  this.engine.start();
  this.latestPlan=omegaWavePlan(run.seed,run.wave);
  this.beginWave();
 }
 get run():OmegaProtocolRun{return this.active;}
 get plan():OmegaWavePlan{return this.latestPlan;}
 get snapshot():OmegaCombatSnapshot {
  return {
   run:this.active,plan:this.latestPlan,
   enemiesAlive:this.engine.state.hazards.filter(h=>h.hp>0).length,
   enginePhase:this.engine.state.phase,
   playerHp:this.engine.state.player.hp,
   playerX:this.engine.state.player.x,
   playerY:this.engine.state.player.y,
   armed:this.armed,
  };
 }
 private beginWave(){
  if(this.active.phase!=='battle')throw new Error('Cannot spawn during reward/terminal phase');
  this.latestPlan=omegaWavePlan(this.active.seed,this.active.wave);
  const plan=this.latestPlan;
  const enemyCount=Math.max(4,Math.min(OMEGA_MAX_LIVE_THREATS-(plan.isBoss?1:0),
   Math.floor(plan.budget/9)));
  const specs:Array<{type:HazardType;boss?:boolean;hpScale:number;speedScale:number}>=[];
  for(let i=0;i<enemyCount;i++){
   const type=plan.threatKinds[omegaSeedHash(this.active.seed,plan.wave*31+i)%plan.threatKinds.length]!;
   const scale=1+Math.min(2,plan.intensity*.16);
   const speed=plan.modifier==='crosswind'?1.13:plan.modifier==='unstable_ground'?.93:1;
   specs.push({type,hpScale:scale,speedScale:speed});
  }
  if(plan.isBoss)specs.push({type:'CRANE_BOSS',boss:true,hpScale:1.3+plan.intensity*.35,speedScale:1});
  this.engine.spawnProtocolEncounter(specs);
  if(plan.modifier==='crosswind')
   for(const hazard of this.engine.state.hazards)if(!hazard.isStageBoss)hazard.behavior='crosswind';
  this.armed=true;
 }
 /** A fixed-step Watch-engine update; rewards require actual hazards cleared. */
 update(dt:number,input:GameInput):OmegaCombatSnapshot {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid frame time');
  if(!this.armed||this.active.phase!=='battle')return this.snapshot;
  // Unstable-ground temporarily limits input magnitude without changing the
  // player's permanent/current speed or touching the normal Watch engine.
  const adjusted= this.latestPlan.modifier==='unstable_ground'
   ? {...input,moveX:input.moveX*.78,moveY:input.moveY*.78}
   : input;
  this.engine.update(dt,adjusted);
  const state=this.engine.state;
  if(state.phase==='defeat'||state.player.hp<=0){
   this.armed=false;
   this.active=omegaResolveBattle(this.active,{won:false,
    damageTaken:Math.max(0,this.active.hp-state.player.hp),remainingHp:0});
   return this.snapshot;
  }
  if(state.phase!=='playing')return this.snapshot;
  if(state.hazards.length===0){
   this.armed=false;
   this.active=omegaResolveBattle(this.active,{won:true,damageTaken:0,
    remainingHp:Math.max(0,Math.min(state.player.maxHp,state.player.hp))});
   if(this.active.phase==='reward'){
    this.engine.setPaused(true);
   }else if(this.active.phase==='battle'){
    this.beginWave();
   }else{
    this.engine.setPaused(true);
   }
  }
  return this.snapshot;
 }
 /**
  * Real engine dash. Not a visual fake: uses Watch cooldown, direction and
  * invulnerability. Cannot be called during a reward or terminal outcome.
  */
 dash():boolean {
  return this.armed && this.active.phase==='battle'
   && this.engine.triggerPlayerDash();
 }
 /** Watch's existing charge-gated director intervention, run-only. */
 ultimate():boolean{
  return this.armed && this.active.phase==='battle'
   && this.engine.triggerDirectorShout();
 }
 /** Choices change real in-session engine weapons and player stats. */
 selectUpgrade(id:OmegaUpgradeId):OmegaCombatSnapshot {
  if(this.active.phase!=='reward')throw new Error('Reward selection is not active');
  const after=omegaChooseUpgrade(this.active,id); // validates offered options + caps
  const p=this.engine.state.player;
  const perkByCard:Partial<Record<OmegaUpgradeId,PerkId>>={
   arc_pulse:'floodlight',radio_overdrive:'radio_boost',precision_beacon:'data_chip',
   shockwave:'grouting_gun',control_field:'cone_trap',emp_link:'emp_generator',
   hazard_scan:'magnet_beacon',
  };
  const perk=perkByCard[id];
  if(perk){
   if(this.engine.state.activePerks[perk]<PERK_CATALOG[perk].maxLevel)this.engine.applyPerk(perk);
   else this.engine.state.player.damageMultiplier+=.03;
  }else{
   switch(id){
    case 'dash_reflex':p.dashMaxCooldown=Math.max(1,(p.dashMaxCooldown??3.2)-.16);break;
    case 'rapid_step':p.speed+=14;break;
    case 'phase_boots':p.dashMaxCooldown=Math.max(1,(p.dashMaxCooldown??3.2)-.2);p.speed+=4;break;
    case 'recovery_protocol':p.hp=Math.min(p.maxHp,p.hp+12);break;
    case 'shield_matrix':p.maxHp+=12;p.hp+=12;break;
   }
  }
  this.active={...after,hp:Math.min(p.maxHp,p.hp),maxHp:p.maxHp};
  if(this.engine.state.phase==='paused')this.engine.setPaused(false);
  this.beginWave();
  return this.snapshot;
 }
 pause():void{
  if(this.active.phase==='battle')this.engine.setPaused(true);
 }
 resume():void{
  if(this.active.phase==='battle')this.engine.setPaused(false);
 }
 /** No wallet, stage clear, profile or premium grants on abandoning a run. */
 abandon():void{
  if(this.active.phase==='battle'||this.active.phase==='reward'){
   this.active={...this.active,phase:'defeat',offers:[]};
   this.armed=false;this.engine.setPaused(true);
  }
 }
}
