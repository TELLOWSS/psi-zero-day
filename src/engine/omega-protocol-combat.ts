import {
 SurvivorsEngine,createInitialSurvivorsState,DEFAULT_PERMANENT_UPGRADES,
 type GameInput,PERK_CATALOG,
} from './patrol-survivors-engine';
import type {PerkId,HazardType} from '../domain/patrol-survivors';
import {
 omegaCreateBossTelegraph,omegaAdvanceBossTelegraph,
 type OmegaBossTelegraph,
} from './omega-protocol-boss-pattern';
import {
 omegaFieldPlan,omegaFieldInitialProgress,omegaFieldCanInteract,omegaFieldResolveCollision,omegaFieldCurrentStep,omegaFieldScreenMoveToWorld,omegaFieldNativeTerrain,
 type OmegaFieldPlan,type OmegaFieldProgress,
} from '../domain/omega-protocol-field';
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
 readonly bossHp:number|null;
 readonly bossMaxHp:number|null;
 readonly playerX:number;
 readonly playerY:number;
 readonly armed:boolean;
 readonly field:Readonly<{plan:OmegaFieldPlan;progress:OmegaFieldProgress}>|null;
 readonly bossTelegraph:OmegaBossTelegraph|null;
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
 private readonly fieldTraversal:boolean;
 private currentField:OmegaFieldPlan|null=null;
 private fieldStatus:OmegaFieldProgress|null=null;
 private bossPattern:OmegaBossTelegraph|null=null;
 private lastFacing={x:0,y:1};
 private playerMoving=false;
 constructor(
  seed:number,watchClears:number,masterCosmeticEligible=false,
  options:Readonly<{fieldTraversal?:boolean}>={},
 ){
  this.fieldTraversal=options.fieldTraversal===true;
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
 get facing():Readonly<{x:number;y:number}>{return {...this.lastFacing};}
 get moving():boolean{return this.playerMoving;}
 get field():Readonly<{plan:OmegaFieldPlan;progress:OmegaFieldProgress}>|null{
  return this.currentField&&this.fieldStatus
   ?{plan:this.currentField,progress:this.fieldStatus}
   :null;
 }
 get snapshot():OmegaCombatSnapshot {
  const liveBoss=this.engine.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
  return {
   run:this.active,plan:this.latestPlan,
   enemiesAlive:this.engine.state.hazards.filter(h=>h.hp>0).length,
   enginePhase:this.engine.state.phase,
   playerHp:this.engine.state.player.hp,
   bossHp:liveBoss?Math.max(0,liveBoss.hp):null,
   bossMaxHp:liveBoss?Math.max(1,liveBoss.maxHp):null,
   playerX:this.engine.state.player.x,
   playerY:this.engine.state.player.y,
   armed:this.armed,
   field:this.field,
   bossTelegraph:this.bossPattern,
  };
 }
 private beginWave(){
  if(this.active.phase!=='battle')throw new Error('Cannot spawn during reward/terminal phase');
  this.latestPlan=omegaWavePlan(this.active.seed,this.active.wave);
  const plan=this.latestPlan;
  if(this.fieldTraversal){
   this.currentField=omegaFieldPlan(this.active.seed,plan.wave);
   this.fieldStatus=omegaFieldInitialProgress();
   // No leftover projectiles, drops or defeated enemy sprites can leak from
   // the previous room into a newly entered field node.
   this.engine.state.projectiles=[];
   this.engine.state.drops=[];
   this.engine.state.hazards=[];
   // Native Watch combat resolves enemy routes and projectile cover against
   // these SAME industrial objects (not just the hero's visual blockers).
   this.engine.state.terrain=omegaFieldNativeTerrain(this.currentField);
   this.engine.state.player.x=this.currentField.entry.x;
   this.engine.state.player.y=this.currentField.entry.y;
  }
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
  this.bossPattern=null;
  if(this.fieldTraversal&&(plan.wave===9||plan.wave===15)){
   const boss=this.engine.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
   if(boss)this.bossPattern=omegaCreateBossTelegraph(plan.wave,this.engine.state.player);
  }
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
  // Player controls remain screen-relative even though the construction
  // field is rendered with a skewed 3/4 camera.
  const headingMagnitude=Math.hypot(input.moveX,input.moveY);
  this.playerMoving=headingMagnitude>.08;
  if(this.playerMoving){
   this.lastFacing={x:input.moveX/headingMagnitude,y:input.moveY/headingMagnitude};
  }
  const move=this.fieldTraversal
   ?omegaFieldScreenMoveToWorld(input.moveX,input.moveY)
   :{x:input.moveX,y:input.moveY};
  const adjusted= this.latestPlan.modifier==='unstable_ground'
   ? {...input,moveX:move.x*.78,moveY:move.y*.78}
   :{...input,moveX:move.x,moveY:move.y};
  const prior={x:this.engine.state.player.x,y:this.engine.state.player.y};
  this.engine.update(dt,adjusted);
  const state=this.engine.state;
  if(this.currentField&&state.phase==='playing'){
   const corrected=omegaFieldResolveCollision(prior,state.player,this.currentField.obstacles,21);
   state.player.x=corrected.x;state.player.y=corrected.y;
  }
  // One serverless, in-run boss warning/strike. No damage occurs before a
  // visibly timed warning; each attack has a one-time collision event.
  if(this.bossPattern&&state.phase==='playing'){
   const boss=state.hazards.find(h=>h.isStageBoss&&h.hp>0);
   if(!boss){
    this.bossPattern=null;
   }else{
    const result=omegaAdvanceBossTelegraph(
     this.bossPattern,Math.min(.05,dt),state.player,boss.hp/Math.max(1,boss.maxHp));
    this.bossPattern=result.next;
    if(result.hit&&!state.player.isDashing&&(state.player.invincibleTime??0)<=0){
     const damage=result.next.empowered?18:12;
     const inflicted=Math.min(damage,Math.max(0,state.player.hp));
     state.player.hp=Math.max(0,state.player.hp-inflicted);
     state.player.invincibleTime=Math.max(state.player.invincibleTime??0,.55);
     // Feed existing Watch damage indicators and inspection statistics;
     // don't grant credits, campaign XP or permanent achievements.
     state.lastDamage={source:'CRANE_BOSS',amount:inflicted,remaining:2};
     if(state.terrainRecord)state.terrainRecord.damageTaken+=inflicted;
     state.hitStopTimer=Math.max(state.hitStopTimer??0,.04);
    }
   }
  }
  if(state.phase==='defeat'||state.player.hp<=0){
   this.armed=false;
   this.active=omegaResolveBattle(this.active,{won:false,
    damageTaken:Math.max(0,this.active.hp-state.player.hp),remainingHp:0});
   return this.snapshot;
  }
  if(state.phase!=='playing')return this.snapshot;
  if(state.hazards.filter(h=>h.hp>0).length===0){
   if(this.currentField&&this.fieldStatus){
    if(this.fieldStatus.phase==='combat'){
     this.fieldStatus={phase:'objective',eventComplete:false,exitUnlocked:false,completedSteps:0};
    }
    // The player must physically reach the objective and then the exit.
    // Clearing the arena alone no longer advances an expedition.
   }else{
    this.settleWave();
   }
  }
  return this.snapshot;
 }
 /** Finish a defeated encounter only after the actual exit interaction. */
 private settleWave():void{
  if(!this.armed||this.active.phase!=='battle')return;
  this.armed=false;
  const state=this.engine.state;
  this.active=omegaResolveBattle(this.active,{won:true,damageTaken:0,
   remainingHp:Math.max(0,Math.min(state.player.maxHp,state.player.hp))});
  if(this.active.phase==='reward'||this.active.phase==='victory'){
   this.engine.setPaused(true);
  }else{
   this.beginWave();
  }
 }
 /** Context-sensitive real field interactions, with range and combat gates. */
 interact():Readonly<{success:boolean;reason:'NOT_READY'|'OUT_OF_RANGE'|'STEP_COMPLETE'|'EVENT_COMPLETE'|'EXIT_OPENED'}>{
  if(!this.currentField||!this.fieldStatus||!this.armed||
     this.active.phase!=='battle'||this.engine.state.phase!=='playing')
   return {success:false,reason:'NOT_READY'};
  if(this.engine.state.hazards.some(h=>h.hp>0))return {success:false,reason:'NOT_READY'};
  if(this.fieldStatus.phase==='objective'){
   const step=omegaFieldCurrentStep(this.currentField,this.fieldStatus);
   if(!step)return {success:false,reason:'NOT_READY'};
   if(!omegaFieldCanInteract(this.engine.state.player,step.target,this.currentField.obstacles))
    return {success:false,reason:'OUT_OF_RANGE'};
   const completedSteps=this.fieldStatus.completedSteps+1;
   const allDone=completedSteps>=this.currentField.event.steps.length;
   this.fieldStatus={
    phase:allDone?'exit':'objective',
    eventComplete:allDone,
    exitUnlocked:allDone,
    completedSteps,
   };
   return {success:true,reason:allDone?'EVENT_COMPLETE':'STEP_COMPLETE'};
  }
  if(this.fieldStatus.phase==='exit'){
   if(!omegaFieldCanInteract(this.engine.state.player,this.currentField.exit,this.currentField.obstacles))
    return {success:false,reason:'OUT_OF_RANGE'};
   this.settleWave();
   return {success:true,reason:'EXIT_OPENED'};
  }
  return {success:false,reason:'NOT_READY'};
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
