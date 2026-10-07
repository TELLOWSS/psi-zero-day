import {describe,expect,it} from 'vitest';
import type {Hazard,PerkId,ProjectileKind} from '../src/domain/patrol-survivors';
import {createInitialSurvivorsState,SurvivorsEngine,PERK_CATALOG} from '../src/engine/patrol-survivors-engine';
import {equipmentTuning,upgradeComparison} from '../src/engine/survivors-equipment-tuning';
import {createBossCombat} from '../src/engine/survivors-boss-combat';
import {bossGameplayForStage} from '../src/engine/survivors-boss-gameplay';

// Isolate real production weapon/collision passes from spawning and movement.
function fixture(){
 const state=createInitialSurvivorsState();state.phase='playing';
 for(const id of Object.keys(state.activePerks) as PerkId[])state.activePerks[id]=0;
 state.player.critRate=0;state.interactiveHazards=[];
 const target:Hazard={id:'target',type:'GAS_LEAK',x:state.player.x+60,y:state.player.y,hp:1e6,maxHp:1e6,speed:0,radius:20,damage:0,expValue:0};
 state.hazards=[target];
 const engine=new SurvivorsEngine(state,19);
 const passes=engine as unknown as {updateWeapons(dt:number):void;checkCollisions():void;damageHazard(h:Hazard,amount:number,projectile?:boolean):void};
 return {state,target,engine,passes};
}
const weapons:readonly [PerkId,ProjectileKind|null][]=[
 ['radio_boost','radio'],['extinguisher','extinguisher'],['floodlight',null],['cone_trap','cone_trap'],['safety_drone','drone_laser'],['grouting_gun','grout_slug'],['emp_generator','emp_pulse'],
 ['satellite_broadcast','satellite_wave'],['cryo_blizzard','cryo_blast'],['tesla_dome','tesla_bolt'],['emf_barricade','emf_beam'],['hunter_swarm','hunter_beam'],['hydraulic_ram','hydraulic_wave'],['plasma_grid','plasma_arc'],
];
const repeatedKinds=['extinguisher','cryo_blast','cone_trap','emf_beam','tesla_bolt'];
describe('equipment damage matches tuning and actual HP loss',()=>{
 for(const [id,kind] of weapons){
  for(const level of PERK_CATALOG[id].category==='evolution'?[1]:[1,2,3,4,5]){
   it(`${id} level ${level}: scaled launch, contact and continuous damage`,()=>{
    const {state,target,passes}=fixture();state.activePerks[id]=level;state.player.damageMultiplier=1.2;state.inFloodlight=true;
    const tuning=equipmentTuning(id,level)!,scale=1.2*1.3,dt=.1;
    passes.updateWeapons(dt);
    const direct=(tuning.continuousDamage??0)*dt+(id==='tesla_dome'?tuning.damage:0);
    expect(1e6-target.hp).toBeCloseTo(direct*scale);
    const shots=state.projectiles.filter(p=>p.kind===kind);
    if(!kind){expect(shots).toHaveLength(0);return;}
    expect(shots).toHaveLength(id==='tesla_dome'?1:tuning.count);
    const damage=id==='tesla_dome'?tuning.secondaryDamage!:tuning.damage;
    for(const shot of shots){expect(shot.damage).toBeCloseTo(damage*scale);shot.x=target.x;shot.y=target.y;}
    const before=target.hp;passes.checkCollisions();
    expect(before-target.hp).toBeCloseTo(shots.length*damage*scale);
    const after=target.hp,contacts=repeatedKinds.includes(kind)?shots.filter(p=>p.pierce>0).length:0;
    passes.checkCollisions();expect(after-target.hp).toBeCloseTo(contacts*damage*scale);
   });
  }
 }
 it('ballistic and pulse pierce uses distinct targets; spray/trap contact charges remain bounded',()=>{
  for(const [,kind] of weapons){
   if(!kind)continue;
   const {state,target,passes}=fixture();const second={...target,id:'second'};state.hazards.push(second);
   state.projectiles=[{id:'shot',kind,x:target.x,y:target.y,vx:0,vy:0,radius:25,damage:30,duration:1,pierce:3}];
   for(let frame=0;frame<60;frame++)passes.checkCollisions();
   if(repeatedKinds.includes(kind)){
    expect(target.hp,kind).toBe(1e6-60);expect(second.hp,kind).toBe(1e6-30);expect(state.projectiles[0]!.pierce,kind).toBe(0);
   }else{
    expect(target.hp,kind).toBe(1e6-30);expect(second.hp,kind).toBe(1e6-30);expect(state.projectiles[0]!.pierce,kind).toBe(1);
   }
  }
 });
 it('critical and weak-point multipliers apply once and feedback reports clamped HP loss',()=>{
  for(const [critical,weak,factor] of [[false,false,1],[true,false,2],[true,true,2.5]] as const){
   const {state,target,passes,engine}=fixture();state.player.critRate=critical?1:0;target.weakPointExposed=weak;
   state.projectiles=[{id:'hit',kind:'radio',x:target.x,y:target.y,vx:0,vy:0,radius:20,damage:30,duration:1,pierce:3}];
   passes.checkCollisions();expect(1e6-target.hp).toBe(30*factor);
   expect(engine.drainProjectileFeedback().find(e=>e.phase==='impact')?.appliedDamage).toBe(30*factor);
  }
  const {state,target,passes,engine}=fixture();target.hp=10;
  state.projectiles=[{id:'overkill',kind:'radio',x:target.x,y:target.y,vx:0,vy:0,radius:20,damage:100,duration:1,pierce:1}];
  passes.checkCollisions();expect(target.hp).toBe(0);expect(engine.drainProjectileFeedback().find(e=>e.phase==='impact')?.appliedDamage).toBe(10);
 });
 it('piercing contact cannot repeatedly drain an environmental target either',()=>{
  const {state,target,passes}=fixture();state.hazards=[];
  state.interactiveHazards=[{id:'barrel',type:'explosive_barrel',x:target.x,y:target.y,hp:1000,maxHp:1000,radius:20,state:'idle',timer:0}];
  state.projectiles=[{id:'wave',kind:'satellite_wave',x:target.x,y:target.y,vx:0,vy:0,radius:20,damage:95,duration:1,pierce:3}];
  for(let frame=0;frame<60;frame++)passes.checkCollisions();
  expect(state.interactiveHazards[0]!.hp).toBe(905);expect(state.projectiles[0]!.pierce).toBe(2);
 });
 it('blocked boss damage does not animate false HP loss; valid bursts do',()=>{
  const {state,target,passes}=fixture();target.bossEncounterManaged=true;target.bossGameplay=createBossCombat(bossGameplayForStage('stage_01'));
  state.bossEncounter={bossId:target.id,phase:'combat',remaining:0};
  target.bossGameplay.combatPhase='pattern';passes.damageHazard(target,100,true);
  expect(target.hp).toBe(1e6);expect(target.hitFlashTimer).toBeUndefined();
  target.bossGameplay.combatPhase='weak_point';target.bossGameplay.signatureResolvedThisCycle=true;
  passes.damageHazard(target,100,true);expect(target.hp).toBe(1e6);expect(target.bossGameplay.combatPhase).toBe('burst');expect(target.hitFlashTimer).toBeUndefined();
  passes.damageHazard(target,100,true);expect(target.hp).toBe(1e6-200);expect(target.hitFlashTimer).toBe(.08);
 });
 it('continuous aura HP loss is independent of timestep',()=>{
  for(const id of ['floodlight','tesla_dome','plasma_grid'] as const){
   const losses=[];
   for(const dt of [1/30,1/60,1/120]){
    const {state,target,passes}=fixture();state.activePerks[id]=1;
    // Suppress periodic strikes after their first activation in both runs.
    passes.updateWeapons(0);const before=target.hp;
    for(let i=0;i<Math.round(.2/dt);i++)passes.updateWeapons(dt);
    losses.push(before-target.hp);
   }
   expect(losses[0]).toBeCloseTo(losses[1]!);expect(losses[1]).toBeCloseTo(losses[2]!);
  }
 });
 it('upgrade intervals use the same gear-enhanced 75 percent cap as combat',()=>{
  const {state}=fixture();state.player.cooldownReduction=.7;
  expect(upgradeComparison('radio_boost',1,'radio_boost',0,state.player,false).find(r=>r.key==='interval')?.after).toBeCloseTo(1.05*.3);
 });
});
