import {
 SurvivorsEngine,createInitialSurvivorsState,DEFAULT_PERMANENT_UPGRADES,
 type GameInput,PERK_CATALOG,
} from './patrol-survivors-engine';
import type {PerkId,HazardType} from '../domain/patrol-survivors';
import {
 omegaCreateDamageEvent,omegaDamageSourceForZombie,omegaSummarizeDamage,
 OMEGA_MAX_DAMAGE_LOG,
 type OmegaDamageEvent,type OmegaDamageSource,type OmegaDamageSummary,
} from '../domain/omega-protocol-damage-audit';
import {omegaBladeDamage,omegaBladeNextCombo,omegaBladeTargetInArc,OMEGA_BLADE_COOLDOWN,OMEGA_BLADE_RANGE,type OmegaBladeComboStep} from '../domain/omega-protocol-blade';
import {omegaFieldNextRoute} from '../domain/omega-protocol-navigation';
import {
 omegaGateTransitLink,omegaGateTransitStart,omegaGateTransitArrive,
 omegaGateTransitStep,omegaGateTransitIsLocked,
 OMEGA_CONNECTED_FIELD_COUNT,omegaConnectedDeckElevation,
 OMEGA_DECK_BOARDING_SECONDS,omegaConnectedVerticalTravelSeconds,
 type OmegaFieldTransit,type OmegaFieldTransitLink,
} from '../domain/omega-protocol-field-transit';
import {
 omegaZombieKindForSlot,omegaCreateZombieBrain,omegaAdvanceZombieBrain,
 type OmegaZombieBrain,type OmegaZombieKind,
} from '../domain/omega-protocol-zombie-ai';
import {omegaStageEncounterPositions} from '../domain/omega-protocol-encounter-stage';
import {
 omegaCreateBossTelegraph,omegaAdvanceBossTelegraph,
 type OmegaBossTelegraph,
} from './omega-protocol-boss-pattern';
import {
 OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT,OMEGA_QUARTER_VIEW,omegaFieldPlan,omegaFieldInitialProgress,omegaFieldCanInteract,omegaFieldResolveCollision,omegaFieldCurrentStep,omegaFieldScreenMoveToWorld,omegaFieldNativeTerrain,
 type OmegaFieldPlan,type OmegaFieldProgress,
} from '../domain/omega-protocol-field';
import {omegaBladeEligible} from '../domain/omega-protocol-blade';
import {
 omegaProtocolAccess,omegaStartRun,omegaWavePlan,omegaResolveBattle,omegaChooseUpgrade,omegaSeedHash,
 type OmegaProtocolRun,type OmegaUpgradeId,type OmegaWavePlan,
} from '../domain/omega-protocol-run';

export interface OmegaBladeOptions {
 readonly smartAssist?:boolean;
 readonly preferredTargetId?:string|null;
 readonly markedIds?:ReadonlySet<string>;
}
export interface OmegaBladeHitTarget {
 readonly id:string;
 readonly x:number;
 readonly y:number;
 readonly damage:number;
 readonly killed:boolean;
 readonly boss:boolean;
 readonly armored:boolean;
}
export interface OmegaBladeStrike {
 readonly time:number;
 readonly combo:OmegaBladeComboStep;
 readonly hits:number;
 readonly totalDamage:number;
 readonly x:number;
 readonly y:number;
 readonly facingX:number;
 readonly facingY:number;
 readonly hitTargets?:readonly OmegaBladeHitTarget[];
}
export interface OmegaCombatSnapshot {
 readonly run:OmegaProtocolRun;
 readonly plan:OmegaWavePlan;
 readonly enemiesAlive:number;
 readonly enginePhase:string;
 readonly playerHp:number;
 readonly playerMaxHp:number;
 readonly bossHp:number|null;
 readonly bossMaxHp:number|null;
 readonly playerX:number;
 readonly playerY:number;
 readonly armed:boolean;
 readonly field:Readonly<{plan:OmegaFieldPlan;progress:OmegaFieldProgress}>|null;
 readonly gateTransit:OmegaFieldTransit|null;
 readonly bossTelegraph:OmegaBossTelegraph|null;
 readonly blade:OmegaBladeStrike|null;
 readonly bladeCooldownRemaining:number;
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
 private readonly gateTransition:boolean;
 private readonly qaGateTravel:boolean;
 private readonly qaGateTravelUntilWave:number;
 private readonly interactivePolish:boolean;
 readonly connectedFields:readonly OmegaFieldPlan[]|null;
 private passageStart:{x:number;y:number}|null=null;
 get crossingConnectedPassage():boolean{return this.passageStart!==null;}
 get fieldWorldOffsetX():number{
  const wave=this.currentField?.wave;
  return wave&&this.connectedFields?.[wave-1]?OMEGA_FIELD_WIDTH*(wave-1):0;
 }
 get fieldElevation():number{
  return this.connectedFields&&this.currentField?omegaConnectedDeckElevation(this.currentField.wave):0;
 }
 get playerElevation():number{
  const transit=this.transit;
  const elevation=this.fieldElevation;
  if(!this.crossingConnectedPassage)return elevation;
  if(this.active.phase==='reward'&&this.pendingArrival)
   return omegaConnectedDeckElevation(this.pendingArrival.toWave);
  if(transit?.phase!=='depart')return elevation;
  const travel=omegaConnectedVerticalTravelSeconds(transit.link.kind);
  if(!travel)return elevation;
  const fraction=Math.max(0,Math.min(1,(transit.elapsed-OMEGA_DECK_BOARDING_SECONDS)/travel));
  const rise=omegaConnectedDeckElevation(transit.link.toWave)-elevation;
  return elevation+rise*fraction*fraction*(3-2*fraction);
 }
 get gateTransit():OmegaFieldTransit|null{return this.transit;}
 private transit:OmegaFieldTransit|null=null;
 private pendingArrival:OmegaFieldTransitLink|null=null;
 private currentField:OmegaFieldPlan|null=null;
 private fieldStatus:OmegaFieldProgress|null=null;
 private bossPattern:OmegaBossTelegraph|null=null;
 private lastFacing={x:0,y:1};
 private playerMoving=false;
 private bladeLastTime=-Infinity;
 private bladeStep:OmegaBladeComboStep=1;
 private bladeResult:OmegaBladeStrike|null=null;
 private readonly zombieBrains=new Map<string,OmegaZombieBrain>();
 private readonly damageLog:OmegaDamageEvent[]=[];
 constructor(
  seed:number,extremeStageClears:number,masterCosmeticEligible=false,
  options:Readonly<{fieldTraversal?:boolean;gateTransition?:boolean;qaGateTravel?:boolean;qaGateTravelUntilWave?:number;continuousOpening?:boolean;interactivePolish?:boolean}>={},
 ){
  this.fieldTraversal=options.fieldTraversal===true;
  this.gateTransition=this.fieldTraversal&&options.gateTransition===true;
  this.interactivePolish=options.interactivePolish===true;
  // This low-level engine has no Vite ImportMetaEnv typings. The *only*
  // production caller (OmegaProtocolPlaytest) gates this scenario behind
  // import.meta.env.DEV and a literal query. Keep the engine test option
  // impossible without opting in to physical gate transitions as well.
  if(options.qaGateTravel&&!this.gateTransition)
   throw new Error('Test-only gate-walk requires real field gate transitions');
  this.qaGateTravel=this.gateTransition&&options.qaGateTravel===true;
  this.qaGateTravelUntilWave=options.qaGateTravelUntilWave??Infinity;
  const access=omegaProtocolAccess(extremeStageClears,masterCosmeticEligible);
  const run=omegaStartRun(seed,access);
  if(!run)throw new Error('Complete all 50 Watch Extreme stages before entering OMEGA PROTOCOL');
  this.active=run;
  this.connectedFields=null;
  if(this.gateTransition&&options.continuousOpening){
   const fields:OmegaFieldPlan[]=[];
   for(let wave=1;wave<=OMEGA_CONNECTED_FIELD_COUNT;wave++){
    const plan=omegaFieldPlan(run.seed,wave);
    const previous=fields.at(-1);
    fields.push(previous?{...plan,entry:{...plan.entry,y:previous.exit.y}}:plan);
   }
   this.connectedFields=fields;
  }
  // Isolated zero-upgrade base character with no premium or operation handoff.
  const state=createInitialSurvivorsState('player',{...DEFAULT_PERMANENT_UPGRADES},
   'stage_01','standard',{owned:[],equipped:[]},[]);
  // AIRA's OMEGA-only initial weapon is the genuine native Watch radio
  // projectile (future SIGMA RAIL art). The standard Watch 'player' profile
  // starts with a different tool, which previously left the advertised gun
  // UNEQUIPPED and masked the bug in sword-only gameplay. Give this isolated
  // run precisely one free starter gun; no Watch character/profile, wallet
  // credits, perks or permanent unlocks are changed.
  for(const key of Object.keys(state.activePerks) as PerkId[])state.activePerks[key]=0;
  state.activePerks.radio_boost=1;
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
 get lastBladeStrike():OmegaBladeStrike|null{return this.bladeResult;}
 get nextBladeCombo():OmegaBladeComboStep{
  if(!Number.isFinite(this.bladeLastTime))return 1;
  return omegaBladeNextCombo(this.bladeStep,this.engine.state.gameTime-this.bladeLastTime);
 }
 /** Immutable read-only combat diagnostics; NEVER used to modify AI/HP. */
 get damageEvents():readonly OmegaDamageEvent[]{return [...this.damageLog];}
 damageSummary(wave=this.latestPlan.wave):OmegaDamageSummary{
  return omegaSummarizeDamage(this.damageLog,wave);
 }
 private recordDamage(source:OmegaDamageSource,amount:number):void{
  if(amount<=0)return;
  this.damageLog.push(omegaCreateDamageEvent(
   this.latestPlan.wave,this.engine.state.gameTime,source,
   amount,this.engine.state.player.hp));
  if(this.damageLog.length>OMEGA_MAX_DAMAGE_LOG)this.damageLog.shift();
 }
 zombieBrain(id:string):OmegaZombieBrain|null{return this.zombieBrains.get(id)??null;}
 get zombieTelemetry():readonly Readonly<{id:string;kind:OmegaZombieKind;phase:string;
  x:number;y:number;hp:number;warnings:number;attacks:number;hits:number;damageDone:number}>[]{
  return this.engine.state.hazards.flatMap(h=>{
   const b=this.zombieBrains.get(h.id);
   return b?[{id:h.id,kind:b.kind,phase:b.phase,x:h.x,y:h.y,hp:h.hp,
    warnings:b.warnings,attacks:b.attacks,hits:b.hits,damageDone:b.damageDone}]:[];
  });
 }
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
   playerMaxHp:this.engine.state.player.maxHp,
   bossHp:liveBoss?Math.max(0,liveBoss.hp):null,
   bossMaxHp:liveBoss?Math.max(1,liveBoss.maxHp):null,
   playerX:this.engine.state.player.x,
   playerY:this.engine.state.player.y,
   armed:this.armed,
   field:this.field,
   gateTransit:this.transit,
   bossTelegraph:this.bossPattern,
   blade:this.bladeResult,
   bladeCooldownRemaining:Math.max(0,OMEGA_BLADE_COOLDOWN-(this.engine.state.gameTime-this.bladeLastTime)), 
  };
 }
 private beginWave(){
  if(this.active.phase!=='battle')throw new Error('Cannot spawn during reward/terminal phase');
  this.latestPlan=omegaWavePlan(this.active.seed,this.active.wave);
  const plan=this.latestPlan;
  this.bladeLastTime=-Infinity;
  this.bladeStep=1;
  this.bladeResult=null;
  this.zombieBrains.clear();
  if(this.fieldTraversal){
   this.currentField=this.connectedFields?.[plan.wave-1]??omegaFieldPlan(this.active.seed,plan.wave);
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
  const enemyCount=Math.max(5,Math.min(OMEGA_MAX_LIVE_THREATS-(plan.isBoss?1:0),
   Math.floor(plan.budget/9)));
  const specs:Array<{type:HazardType;boss?:boolean;hpScale:number;speedScale:number}>=[];
  for(let i=0;i<enemyCount;i++){
   // The first native enemy in every quarantine zone is a fictional
   // HELMET_ZOMBIE (legacy engine UNHELMETED ID). This is intentional,
   // not merely a possible random archetype in the encounter pool.
   // Four separate infected zombie AI types occupy the first four
   // genuine native hazard slots. Additional industry machinery remains.
   const type=i<4?'UNHELMETED':i===4?'RUNAWAY_CART':plan.threatKinds[omegaSeedHash(this.active.seed,plan.wave*31+i)%plan.threatKinds.length]!;
   const scale=1+Math.min(2,plan.intensity*.16);
   const speed=plan.modifier==='crosswind'?1.13:plan.modifier==='unstable_ground'?.93:1;
   specs.push({type,hpScale:scale,speedScale:speed});
  }
  if(plan.isBoss)specs.push({type:'CRANE_BOSS',boss:true,hpScale:1.3+plan.intensity*.35,speedScale:1});
  this.engine.spawnProtocolEncounter(specs);
  let infectedSlot=0;
  for(const h of this.engine.state.hazards){
   if(h.type!=='UNHELMETED'||h.isStageBoss)continue;
   const kind=omegaZombieKindForSlot(infectedSlot,plan.wave);
   this.zombieBrains.set(h.id,omegaCreateZombieBrain(h,kind,infectedSlot));
   infectedSlot++;
  }
  if(this.currentField&&this.fieldTraversal){
   // Native Watch spawns at map edges by design. That makes our player-
   // controlled close-camera first field visually empty. Stage existing
   // REAL threats where the player can see them, without creating fake actors
   // or changing their Watch AI, damage, speed, HP, or projectile behavior.
   const hazards=this.engine.state.hazards;
   const positions=omegaStageEncounterPositions(
    this.currentField,this.engine.state.player,
    hazards.map(h=>({x:h.x,y:h.y,radius:h.radius,isStageBoss:h.isStageBoss})),
   );
   for(let i=0;i<hazards.length;i++){
    hazards[i]!.x=positions[i]!.x;
    hazards[i]!.y=positions[i]!.y;
   }
  }
  this.bossPattern=null;
  if(this.fieldTraversal&&(plan.wave===9||plan.wave===15)){
   const boss=this.engine.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
   if(boss)this.bossPattern=omegaCreateBossTelegraph(plan.wave,this.engine.state.player);
  }
  if(plan.modifier==='crosswind')
   for(const hazard of this.engine.state.hazards)if(!hazard.isStageBoss)hazard.behavior='crosswind';
  if(this.qaGateTravel&&plan.wave===this.qaGateTravelUntilWave)
   this.engine.state.player.invincibleTime=0;
  if(this.qaGateTravel&&this.currentField&&plan.wave<this.qaGateTravelUntilWave){
   // Setup only, never updated while walking: in DEV, tasks/hostiles are
   // already resolved so E + physical movement test the *real* gate.
   // Not a normal mode, no account save, no runtime teleport commands.
   this.engine.state.hazards=[];
   this.zombieBrains.clear();
   this.bossPattern=null;
   this.fieldStatus={phase:'exit',eventComplete:true,exitUnlocked:true,
    completedSteps:this.currentField.event.steps.length};
   if([4,7,10,13].includes(this.currentField.wave)){
    // M04-B/C boundary proof: preserve native entry after real ACT transfer.
    // In-sector DEV gate starts remain 190 units outside the actual exit.
    this.engine.state.player.x=this.currentField.entry.x;
    this.engine.state.player.y=this.currentField.entry.y;
   }else if(!this.crossingConnectedPassage){
    this.engine.state.player.x=this.currentField.exit.x-190;
    this.engine.state.player.y=this.currentField.exit.y;
   }
   this.engine.state.player.invincibleTime=999;
  }
  this.armed=true;
 }
 /** A fixed-step Watch-engine update; rewards require actual hazards cleared. */
 update(dt:number,input:GameInput):OmegaCombatSnapshot {
  if(!Number.isFinite(dt)||dt<0)throw new RangeError('Invalid frame time');
  if(!this.armed||this.active.phase!=='battle')return this.snapshot;
  if(omegaGateTransitIsLocked(this.transit)){
   if(this.engine.state.phase==='paused')return this.snapshot;
   const phase=this.transit!.phase;
   const progressed=omegaGateTransitStep(this.transit!,dt);
   this.transit=this.passageStart?{...progressed.next,opacity:0}:progressed.next;
   if(this.passageStart){
    const {player}=this.engine.state;
    const {link,elapsed,duration}=this.transit;
    const walkDuration=phase==='depart'&&omegaConnectedVerticalTravelSeconds(link.kind)
     ?OMEGA_DECK_BOARDING_SECONDS:duration;
    const fraction=Math.min(1,elapsed/walkDuration);
    const from=phase==='depart'?this.passageStart:{x:0,y:link.arrival.y};
    const to=phase==='depart'?{x:OMEGA_FIELD_WIDTH,y:link.departure.y}:link.arrival;
    player.x=from.x+(to.x-from.x)*fraction;
    player.y=from.y+(to.y-from.y)*fraction;
    this.lastFacing={x:1,y:0};
   }
   if(progressed.complete){
    if(phase==='depart'){
     this.settleWave();
     this.transit=null;
     if(this.active.phase==='battle')this.enterPendingArrival();
    }else{
     this.transit=null;
     this.passageStart=null;
    }
   }
   return this.snapshot;
  }
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
  const hpBeforeNative=this.engine.state.player.hp;
  this.engine.update(dt,adjusted);
  const state=this.engine.state;
  // Native Watch's own collision/projectile code may deal damage AND
  // regenerate HP in the same frame. Positive observed net loss is
  // therefore a lower bound, not an invented exact source identity.
  if(hpBeforeNative>state.player.hp)
   this.recordDamage('WATCH_NATIVE_NET',hpBeforeNative-state.player.hp);
  if(this.currentField&&state.phase==='playing'){
   const corrected=omegaFieldResolveCollision(prior,state.player,this.currentField.obstacles,21);
   state.player.x=corrected.x;state.player.y=corrected.y;
  }
  // OMEGA ONLY: independent, telegraphed infected movement/attacks.
  // Native WATCH handles projectiles and player collision, but generic
  // workers have zero OMEGA contact damage and no generic auto-chase.
  // Every zombie remains an actual Watch hazard with real HP.
  if(state.phase==='playing'){
   const obstacles=this.currentField?.obstacles??[];
   for(const h of state.hazards){
    const brain=this.zombieBrains.get(h.id);
    if(!brain||h.hp<=0)continue;
    const tick=omegaAdvanceZombieBrain(h,brain,state.player,obstacles,Math.min(.05,dt));
    if(tick.contactDamage>0&&!state.player.isDashing&&
       (state.player.invincibleTime??0)<=0){
     const amount=Math.min(state.player.hp,tick.contactDamage);
     state.player.hp=Math.max(0,state.player.hp-amount);
     state.player.invincibleTime=.6;
     state.lastDamage={source:'UNHELMETED',amount,remaining:2};
     if(state.terrainRecord)state.terrainRecord.damageTaken+=amount;
     state.hitStopTimer=Math.max(state.hitStopTimer??0,.035);
     brain.hits++;
     brain.damageDone+=amount;
     this.recordDamage(omegaDamageSourceForZombie(brain.kind),amount);
    }
   }
   // Soft non-stacking zombie separation so packs fan out cleanly without hiding HP bars,
   // plus gentle standoff outside warning/charge so monsters never overlap AIRA's legs.
   const liveZombies=this.interactivePolish
    ?state.hazards.filter(h=>h.hp>0&&!h.isStageBoss&&this.zombieBrains.has(h.id))
    :[];
   for(let i=0;i<liveZombies.length;i++){
    const a=liveZombies[i]!;
    for(let j=i+1;j<liveZombies.length;j++){
     const b=liveZombies[j]!;
     const dx=b.x-a.x,dy=b.y-a.y;
     const dist=Math.hypot(dx,dy);
     const minSep=(a.radius+b.radius)*0.92;
     if(dist>=minSep)continue;
     const nx=dist>1e-3?dx/dist:((i%2===0)?1:-1);
     const ny=dist>1e-3?dy/dist:0;
     const push=Math.min(4,(minSep-dist)*0.36)*0.5;
     const pa={x:a.x,y:a.y},pb={x:b.x,y:b.y};
     const na={x:Math.max(24,Math.min(OMEGA_FIELD_WIDTH-24,a.x-nx*push)),y:Math.max(24,Math.min(OMEGA_FIELD_HEIGHT-24,a.y-ny*push))};
     const nb={x:Math.max(24,Math.min(OMEGA_FIELD_WIDTH-24,b.x+nx*push)),y:Math.max(24,Math.min(OMEGA_FIELD_HEIGHT-24,b.y+ny*push))};
     const ra=this.currentField?omegaFieldResolveCollision(pa,na,obstacles,a.radius):na;
     const rb=this.currentField?omegaFieldResolveCollision(pb,nb,obstacles,b.radius):nb;
     a.x=ra.x;a.y=ra.y;b.x=rb.x;b.y=rb.y;
    }
    const brain=this.zombieBrains.get(a.id);
    if(brain&&(brain.phase==='pursue'||brain.phase==='recovery')){
     const pdx=a.x-state.player.x,pdy=a.y-state.player.y;
     const pDist=Math.hypot(pdx,pdy);
     const minGap=a.radius+17;
     if(pDist<minGap){
      const pnx=pDist>1e-3?pdx/pDist:1;
      const pny=pDist>1e-3?pdy/pDist:0;
      const step=Math.min(3.5,(minGap-pDist)*0.45);
      const prior={x:a.x,y:a.y};
      const target={x:Math.max(24,Math.min(OMEGA_FIELD_WIDTH-24,a.x+pnx*step)),y:Math.max(24,Math.min(OMEGA_FIELD_HEIGHT-24,a.y+pny*step))};
      const resolved=this.currentField?omegaFieldResolveCollision(prior,target,obstacles,a.radius):target;
      a.x=resolved.x;a.y=resolved.y;
     }
    }
   }
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
     this.recordDamage(
      result.next.attack==='crane_drop'?'TITAN_HOOK':'BLACK_SIGNAL_CORE',
      inflicted);
    }
   }
  }
  if(state.phase==='defeat'||state.player.hp<=0){
   const damageTaken=Number.isFinite(state.player.hp)?Math.max(0,this.active.hp-state.player.hp):this.active.hp;
   const nextActive=omegaResolveBattle(this.active,{won:false,damageTaken,remainingHp:0});
   this.armed=false;
   this.active=nextActive;
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
 /** Keep run-scoped vitality bounds aligned with in-session loadout/card buffs. */
 syncRunVitality():void{
  const p=this.engine.state.player;
  const maxHp=Number.isFinite(p.maxHp)&&p.maxHp>0?p.maxHp:this.active.maxHp;
  const hp=Number.isFinite(p.hp)?Math.max(0,Math.min(maxHp,p.hp)):Math.min(maxHp,this.active.hp);
  this.active=Object.freeze({...this.active,hp,maxHp});
 }
 /** Finish a defeated encounter only after the actual exit interaction. */
 private settleWave():void{
  if(!this.armed||this.active.phase!=='battle')return;
  const state=this.engine.state;
  const liveMaxHp=Number.isFinite(state.player.maxHp)&&state.player.maxHp>0
   ?Math.max(this.active.maxHp,state.player.maxHp)
   :this.active.maxHp;
  const activeForSettle=liveMaxHp===this.active.maxHp
   ?this.active
   :Object.freeze({...this.active,maxHp:liveMaxHp,hp:Math.min(liveMaxHp,this.active.hp)});
  const remainingHp=Number.isFinite(state.player.hp)
   ?Math.max(0,Math.min(liveMaxHp,state.player.hp))
   :activeForSettle.hp;
  const nextActive=omegaResolveBattle(activeForSettle,{won:true,damageTaken:0,remainingHp});
  this.armed=false;
  this.active=nextActive;
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
   if(this.gateTransition&&this.currentField.wave<15){
    if(this.transit)return {success:false,reason:'NOT_READY'};
    const nextPassageField=this.connectedFields?.[this.currentField.wave];
    const destination=nextPassageField??omegaFieldPlan(this.active.seed,this.currentField.wave+1);
    if(nextPassageField){
     const player=this.engine.state.player;
     this.passageStart={x:player.x,y:player.y};
    }
    this.pendingArrival=omegaGateTransitLink(this.currentField,destination);
    this.transit=omegaGateTransitStart(this.pendingArrival);
    const verticalTravel=nextPassageField?omegaConnectedVerticalTravelSeconds(this.pendingArrival.kind):0;
    if(verticalTravel)this.transit={...this.transit,duration:OMEGA_DECK_BOARDING_SECONDS+verticalTravel};
   }else this.settleWave();
   return {success:true,reason:'EXIT_OPENED'};
  }
  return {success:false,reason:'NOT_READY'};
 }
 /** An original close-range sword attack, using real in-run Watch HP only.
  * Every physical target is tested against the forward arc and solid cover.
  * The basic ranged weapon continues to use the native Watch firing loop.
  */
 blade(options?:OmegaBladeOptions):OmegaBladeStrike|null{
  const state=this.engine.state;
  if(!this.armed||this.active.phase!=='battle'||state.phase!=='playing'||this.transit)return null;
  const time=state.gameTime;
  if(!Number.isFinite(time)||time-this.bladeLastTime<OMEGA_BLADE_COOLDOWN)return null;
  const player=state.player;
  if(player.hp<=0||player.isDashing)return null;
  const combo=omegaBladeNextCombo(this.bladeStep,time-this.bladeLastTime);
  let direction=this.fieldTraversal
   ?omegaFieldScreenMoveToWorld(this.lastFacing.x,this.lastFacing.y)
   :this.lastFacing;
  const bladeEdge=this.active.owned.blade_edge??0;
  const range=OMEGA_BLADE_RANGE+(this.active.owned.blade_reach??0)*18;

  if(options?.smartAssist){
   const engageRange=range+68;
   const obstacles=this.currentField?.obstacles??[];
   let bestTarget:typeof state.hazards[number]|null=null;
   let bestScore=Infinity;
   for(const h of state.hazards){
    if(!omegaBladeEligible(h))continue;
    const direct=Math.hypot(h.x-player.x,h.y-player.y);
    if(direct>engageRange+Math.max(0,h.radius))continue;
    if(this.currentField){
     const route=omegaFieldNextRoute(player,h,obstacles);
     if(!route||route.length>direct+24)continue;
    }
    const isMarked=Boolean(options.markedIds?.has(h.id));
    const isPreferred=options.preferredTargetId===h.id;
    const score=(isMarked?-10000:isPreferred?-2500:0)+direct;
    if(score<bestScore){
     bestScore=score;
     bestTarget=h;
    }
   }
   if(bestTarget){
    const dx=bestTarget.x-player.x;
    const dy=bestTarget.y-player.y;
    const direct=Math.hypot(dx,dy);
    if(direct>1e-3){
     direction={x:dx/direct,y:dy/direct};
     if(this.fieldTraversal){
      const sx=direction.x+OMEGA_QUARTER_VIEW.skewX*direction.y;
      const sy=OMEGA_QUARTER_VIEW.groundYScale*direction.y;
      const slen=Math.hypot(sx,sy)||1;
      this.lastFacing={x:sx/slen,y:sy/slen};
     }else{
      this.lastFacing={x:direction.x,y:direction.y};
     }
     if(direct>range*0.52){
      const stepDist=Math.min(34,direct-range*0.45);
      if(stepDist>2){
       const prior={x:player.x,y:player.y};
       const proposed={
        x:Math.max(24,Math.min(OMEGA_FIELD_WIDTH-24,player.x+direction.x*stepDist)),
        y:Math.max(24,Math.min(OMEGA_FIELD_HEIGHT-24,player.y+direction.y*stepDist)),
       };
       const resolved=this.currentField
        ?omegaFieldResolveCollision(prior,proposed,this.currentField.obstacles,21)
        :proposed;
       player.x=resolved.x;
       player.y=resolved.y;
      }
     }
    }
   }
  }

  let hits=0,totalDamage=0;
  const hitTargets:OmegaBladeHitTarget[]=[];
  const obstacles=this.currentField?.obstacles??[];
  for(const h of state.hazards){
   if(!omegaBladeTargetInArc(player,h,direction,range))continue;
   if(this.currentField){
    const route=omegaFieldNextRoute(player,h,obstacles);
    const direct=Math.hypot(h.x-player.x,h.y-player.y);
    if(!route||route.length>direct+24)continue; // Cannot cut through solid cover.
   }
   const damage=omegaBladeDamage(combo,h,player.damageMultiplier,bladeEdge);
   const dealt=this.engine.damageProtocolConstruct(h.id,damage);
   if(dealt<=0)continue;
   hits++;totalDamage+=dealt;
   const armored=this.zombieBrains.get(h.id)?.kind==='armored'||h.variant==='reinforced_cart'||h.type==='RUNAWAY_CART';
   hitTargets.push({
    id:h.id,x:h.x,y:h.y,damage:dealt,killed:h.hp<=0,
    boss:Boolean(h.isStageBoss),armored,
   });
   h.hitFlashTimer=Math.max(h.hitFlashTimer??0,combo===3?0.16:0.11);
   if(this.interactivePolish&&h.hp>0&&h.type==='UNHELMETED'&&!h.isStageBoss){
    const kdx=h.x-player.x,kdy=h.y-player.y;
    const kDist=Math.hypot(kdx,kdy);
    const knx=kDist>1e-3?kdx/kDist:direction.x;
    const kny=kDist>1e-3?kdy/kDist:direction.y;
    const knockSpeed=combo===3?280:combo===2?175:140;
    h.vx=(h.vx??0)+knx*knockSpeed;
    h.vy=(h.vy??0)+kny*knockSpeed;
    const shove=combo===3?15:8;
    const priorPos={x:h.x,y:h.y};
    const shoved={
     x:Math.max(24,Math.min(OMEGA_FIELD_WIDTH-24,h.x+knx*shove)),
     y:Math.max(24,Math.min(OMEGA_FIELD_HEIGHT-24,h.y+kny*shove)),
    };
    const resolved=this.currentField?omegaFieldResolveCollision(priorPos,shoved,obstacles,h.radius):shoved;
    h.x=resolved.x;h.y=resolved.y;
   }
  }
  this.bladeLastTime=time;
  this.bladeStep=combo;
  this.bladeResult={time,combo,hits,totalDamage,x:player.x,y:player.y,
   facingX:direction.x,facingY:direction.y,hitTargets};
  if(hits>0)state.hitStopTimer=Math.max(state.hitStopTimer??0,.025);
  return this.bladeResult;
 }
 /** Visual-roguelite combo helper: refunds blade cooldown cleanly on confirmed kills. */
 refundBladeCooldown(ratio:number):void{
  const r=Math.max(0,Math.min(1,Number.isFinite(ratio)?ratio:0));
  if(Number.isFinite(this.bladeLastTime)){
   this.bladeLastTime-=OMEGA_BLADE_COOLDOWN*r;
  }
 }
 /**
  * Real engine dash. Not a visual fake: uses Watch cooldown, direction and
  * invulnerability. Cannot be called during a reward or terminal outcome.
  */
 dash():boolean {
  return this.armed && this.active.phase==='battle' && !this.crossingConnectedPassage
   && this.engine.triggerPlayerDash();
 }
 /** Watch's existing charge-gated director intervention, run-only. */
 ultimate():boolean{
  return this.armed && this.active.phase==='battle' && !this.crossingConnectedPassage
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
    // These cards are applied by blade() from run.owned, never via Watch saves.
    case 'blade_edge':case 'blade_reach':break;
   }
  }
  this.active={...after,hp:Math.min(p.maxHp,p.hp),maxHp:p.maxHp};
  if(this.engine.state.phase==='paused')this.engine.setPaused(false);
  this.beginWave();
  this.enterPendingArrival();
  return this.snapshot;
 }
 private enterPendingArrival():void{
  const link=this.pendingArrival;
  if(!link)return;
  this.transit=omegaGateTransitArrive(link);
  if(this.crossingConnectedPassage){
   this.transit={...this.transit,opacity:0};
   this.engine.state.player.x=0;
   this.engine.state.player.y=link.arrival.y;
  }
  this.pendingArrival=null;
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
