import {describe,expect,it} from 'vitest';
import {
 omegaCreateDamageEvent,omegaDamageSourceForZombie,omegaSummarizeDamage,
 OMEGA_MAX_DAMAGE_LOG,
} from '../src/domain/omega-protocol-damage-audit';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const idle={moveX:0,moveY:0,triggerAction:false};
const newSession=()=>new OmegaProtocolCombatSession(20261109,50,false,{
 fieldTraversal:true,gateTransition:false,
});
function toWave(s:OmegaProtocolCombatSession,target:number){
 // Test-only setup for boss DAMAGE PROVENANCE, NOT a no-skip gameplay proof.
 // Actual 15-zone no-skip pilot stays separate in PR #243.
 while(s.run.wave<target){
  s.engine.state.hazards=[];
  s.update(1/60,idle);
  const field=s.field;
  if(!field)throw Error('Missing field for instrumentation unit fixture');
  for(const step of field.plan.event.steps){
   s.engine.state.player.x=step.target.x;
   s.engine.state.player.y=step.target.y;
   expect(s.interact().success).toBe(true);
  }
  s.engine.state.player.x=field.plan.exit.x;
  s.engine.state.player.y=field.plan.exit.y;
  expect(s.interact().success).toBe(true);
  if(s.run.phase==='reward')s.selectUpgrade(s.run.offers[0]!);
 }
}
describe('M04-D2 factual late-game hit source attribution, no combat changes',()=>{
 it('enforces finite positive damage, real wave and immutable event records',()=>{
  expect(omegaCreateDamageEvent(9,42,'TITAN_HOOK',12,60)).toEqual({
   wave:9,atSeconds:42,source:'TITAN_HOOK',amount:12,hpAfter:60,
  });
  expect(()=>omegaCreateDamageEvent(16,1,'WATCH_NATIVE_NET',1,100)).toThrow(RangeError);
  expect(()=>omegaCreateDamageEvent(9,-1,'WATCH_NATIVE_NET',1,100)).toThrow(RangeError);
  expect(()=>omegaCreateDamageEvent(9,1,'WATCH_NATIVE_NET',0,100)).toThrow(RangeError);
  expect(()=>omegaCreateDamageEvent(9,1,'WATCH_NATIVE_NET',Infinity,100)).toThrow(RangeError);
  expect(()=>omegaCreateDamageEvent(9,1,'WATCH_NATIVE_NET',1,NaN)).toThrow(RangeError);
  expect(OMEGA_MAX_DAMAGE_LOG).toBeGreaterThanOrEqual(500);
 });
 it('keeps lower-bound native net loss separate from exact infected and boss hits',()=>{
  const e=[
   omegaCreateDamageEvent(8,1,'INFECTED_DRIFTER',11,89),
   omegaCreateDamageEvent(9,1,'WATCH_NATIVE_NET',4,96),
   omegaCreateDamageEvent(9,2,'INFECTED_SPRINTER',16,80),
   omegaCreateDamageEvent(9,3,'TITAN_HOOK',12,68),
   omegaCreateDamageEvent(9,5,'TITAN_HOOK',18,50),
   omegaCreateDamageEvent(10,6,'INFECTED_STALKER',19,31),
  ];
  const s=omegaSummarizeDamage(e,9);
  expect(s).toMatchObject({wave:9,hitEvents:4,totalObservedDamage:50,
   watchNativeNet:4,infectedDamage:16,bossDamage:30,
   firstHitSeconds:1,lastHitSeconds:5});
  expect(s.bySource).toEqual({
   WATCH_NATIVE_NET:4,INFECTED_SPRINTER:16,TITAN_HOOK:30,
  });
  expect(omegaSummarizeDamage(e,7)).toMatchObject({
   hitEvents:0,totalObservedDamage:0,firstHitSeconds:null,lastHitSeconds:null,
  });
  expect(omegaSummarizeDamage(e,10).infectedDamage).toBe(19);
  expect(omegaDamageSourceForZombie('drifter')).toBe('INFECTED_DRIFTER');
  expect(omegaDamageSourceForZombie('sprinter')).toBe('INFECTED_SPRINTER');
  expect(omegaDamageSourceForZombie('armored')).toBe('INFECTED_ARMORED');
  expect(omegaDamageSourceForZombie('stalker')).toBe('INFECTED_STALKER');
 });
 it('records exact OMEGA drifter warned strike from live engine and leaves HP law unchanged',()=>{
  const s=newSession();
  const h=s.engine.state.hazards.find(x=>x.type==='UNHELMETED'&&!x.isStageBoss);
  expect(h).toBeDefined();
  if(!h)throw Error('No real native helmet zombie');
  const brain=s.zombieBrain(h.id);
  expect(brain?.kind).toBe('drifter');
  if(!brain)throw Error('No linked zombie brain');
  s.engine.state.hazards=[h];
  const p=s.engine.state.player;
  const hpBefore=p.hp;
  p.invincibleTime=0;
  p.regenRate=0;
  h.x=p.x+45;h.y=p.y;
  h.speed=0;h.damage=0;h.hp=100000;h.maxHp=100000;h.isStunned=0;
  // Prevent the real starter radio from stunning this single controlled
  // zombie BEFORE the warned OMEGA contact frame.  This is a unit fixture
  // for damage-accounting only, not normal gameplay or no-skip evidence.
  s.engine.state.activePerks.radio_boost=0;
  s.engine.state.projectiles=[];
  brain.phase='warning';brain.timer=.01;
  s.update(1/30,idle);
  console.log('M04_D2_DRIFTER_TRACE',JSON.stringify({
   zombiePhase:brain.phase,isStunned:h.isStunned,hp:p.hp,
   invincibleTime:p.invincibleTime,enginePhase:s.snapshot.enginePhase,
   events:s.damageEvents,
  }));
  const hits=s.damageEvents.filter(x=>x.source==='INFECTED_DRIFTER');
  expect(hits).toHaveLength(1);
  expect(hits[0]!.amount).toBe(11);
  expect(hits[0]!.hpAfter).toBe(p.hp);
  expect(p.hp).toBe(hpBefore-hits[0]!.amount);
  expect(s.damageSummary(1).infectedDamage).toBe(11);
  expect(s.damageSummary(1).bossDamage).toBe(0);
 });
 it('records exact crane-drop boss hit from live wave-9 clock, without manufacturing hit source',()=>{
  const s=newSession();
  toWave(s,9);
  expect(s.run.wave).toBe(9);
  const boss=s.engine.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
  expect(boss).toBeDefined();
  if(!boss)throw Error('No real native wave-nine boss');
  s.engine.state.hazards=[boss];
  const p=s.engine.state.player;
  const center=s.snapshot.bossTelegraph?.center;
  if(!center)throw Error('No actual native wave-nine telegraph');
  p.x=center.x;p.y=center.y;p.regenRate=0;p.invincibleTime=0;
  boss.x=1300;boss.y=850;boss.speed=0;boss.hp=100000;boss.maxHp=100000;
  const hpBefore=p.hp;
  for(let i=0;i<110;i++)s.update(1/60,idle);
  const events=s.damageEvents.filter(x=>x.source==='TITAN_HOOK');
  expect(events).toHaveLength(1);
  expect(events[0]!.amount).toBe(12);
  expect(events[0]!.wave).toBe(9);
  expect(p.hp).toBe(hpBefore-12);
  expect(s.damageSummary(9)).toMatchObject({
   wave:9,bossDamage:12,hitEvents:1,
  });
  expect(s.damageSummary(8).bossDamage).toBe(0);
  expect(s.damageEvents.length).toBeGreaterThanOrEqual(1);
 });
 it('attributes the real wave-15 BLACK SIGNAL power sweep, distinct from TITAN HOOK',()=>{
  const s=newSession();
  toWave(s,15);
  expect(s.run.wave).toBe(15);
  expect(s.snapshot.bossTelegraph?.attack).toBe('power_sweep');
  const boss=s.engine.state.hazards.find(h=>h.isStageBoss&&h.hp>0);
  expect(boss).toBeDefined();
  if(!boss)throw Error('Missing native final control-core boss');
  s.engine.state.hazards=[boss];
  const p=s.engine.state.player;
  const center=s.snapshot.bossTelegraph?.center;
  if(!center)throw Error('Missing final power-lane telegraph');
  p.x=center.x;p.y=center.y;p.regenRate=0;p.invincibleTime=0;
  boss.x=1300;boss.y=850;boss.speed=0;boss.hp=100000;boss.maxHp=100000;
  const before=p.hp;
  for(let i=0;i<110;i++)s.update(1/60,idle);
  const hits=s.damageEvents.filter(e=>e.source==='BLACK_SIGNAL_CORE');
  expect(hits).toHaveLength(1);
  expect(hits[0]!).toMatchObject({wave:15,amount:12});
  expect(p.hp).toBe(before-12);
  expect(s.damageSummary(15)).toMatchObject({
   bossDamage:12,infectedDamage:0,hitEvents:1,
  });
  expect(s.damageEvents.some(e=>e.source==='TITAN_HOOK')).toBe(false);
 });

});
