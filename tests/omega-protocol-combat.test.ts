import {describe,it,expect} from 'vitest';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';
import {SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {omegaWavePlan} from '../src/domain/omega-protocol-run';

const idle={moveX:0,moveY:0,triggerAction:false};
function clearWave(session:OmegaProtocolCombatSession){
 session.engine.state.hazards=[];
 session.update(1/60,idle);
}
describe('OMEGA PROTOCOL uses the ACTUAL Watch engine under an external encounter director',()=>{
 it('locks mode before ten Watch clears and does not install master-only cosmetic',()=>{
  expect(()=>new OmegaProtocolCombatSession(7,9)).toThrow('10 Watch stages');
  const s=new OmegaProtocolCombatSession(7,10);
  expect(s.engine).toBeInstanceOf(SurvivorsEngine);
  expect(s.run).toMatchObject({wave:1,phase:'battle',owned:{}});
  expect(s.engine.state.premiumGear?.equipped).toEqual([]);
  expect(s.engine.state.permanentUpgrades.vitality).toBe(0);
  expect(s.engine.state.interactiveHazards).toEqual([]);
  expect(s.engine.state.terrain).toEqual([]);
  expect(s.snapshot.enemiesAlive).toBeGreaterThan(0);
  expect(s.snapshot.enemiesAlive).toBeLessThanOrEqual(15);
 });
 it('keeps seeded real engine spawn positions and enemy mixes reproducible, not stage-native wave rules',()=>{
  const a=new OmegaProtocolCombatSession(777,10);
  const b=new OmegaProtocolCombatSession(777,10);
  expect(a.plan).toEqual(omegaWavePlan(777,1));
  expect(a.engine.state.hazards.map(h=>[h.type,h.x,h.y,h.hp]))
   .toEqual(b.engine.state.hazards.map(h=>[h.type,h.x,h.y,h.hp]));
  expect(a.engine.state.phase).toBe('playing');
  a.update(1/30,{moveX:1,moveY:0,triggerAction:true});
  expect(a.engine.state.gameTime).toBeGreaterThan(0);
  expect(a.engine.state.player.x).toBeGreaterThan(700);
  expect(a.engine.state.phase).toBe('playing');
  // Plain, non-protocol Watch engine remains unaffected.
  const original=new SurvivorsEngine(createInitialSurvivorsState(),777);
  original.start();
  original.update(1/30,idle);
  expect(original.state.phase).toBe('playing');
  expect(original.state.player.x).toBe(700);
 });
 it('clears waves, pauses for true three-choice rewards, applies real perk/stats, then resumes',()=>{
  const s=new OmegaProtocolCombatSession(7001,10);
  clearWave(s);
  expect(s.run).toMatchObject({wave:2,phase:'battle',victories:1});
  clearWave(s);
  expect(s.run.phase).toBe('reward');
  expect(s.engine.state.phase).toBe('paused');
  expect(s.run.offers).toHaveLength(3);
  const card=s.run.offers[0]!;
  const before={
   perks:{...s.engine.state.activePerks},
   hp:s.engine.state.player.hp,
   speed:s.engine.state.player.speed,
   maxHp:s.engine.state.player.maxHp,
   cooldown:s.engine.state.player.dashMaxCooldown,
   damage:s.engine.state.player.damageMultiplier,
   pickup:s.engine.state.player.pickupRadius,
  };
  expect(()=>s.selectUpgrade('invalid' as never)).toThrow();
  const after=s.selectUpgrade(card);
  expect(after.run).toMatchObject({wave:3,phase:'battle'});
  expect(after.run.owned[card]).toBe(1);
  expect(after.enemiesAlive).toBeGreaterThan(0);
  expect(s.engine.state.phase).toBe('playing');
  expect([s.engine.state.activePerks,s.engine.state.player.speed,
   s.engine.state.player.maxHp,s.engine.state.player.dashMaxCooldown,
   s.engine.state.player.damageMultiplier,s.engine.state.player.hp,
   s.engine.state.player.pickupRadius]).not.toEqual([
     before.perks,before.speed,before.maxHp,before.cooldown,
     before.damage,before.hp,before.pickup
   ]);
 });
 it('simulates fifteen real encounter creations with two stage-independent bosses and 7 rewards',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10);
  let selections=0,bosses=0;
  for(let wave=1;wave<=15;wave++){
   expect(s.run.wave).toBe(wave);
   expect(s.engine.state.phase).toBe('playing');
   const bossPresent=s.engine.state.hazards.some(h=>h.isStageBoss&&h.type==='CRANE_BOSS');
   if(bossPresent)bosses++;
   expect(bossPresent).toBe(wave===9||wave===15);
   clearWave(s);
   if(s.run.phase==='reward'){
    selections++;
    const chosen=s.run.offers[0]!;
    s.selectUpgrade(chosen);
   }
  }
  expect(bosses).toBe(2);
  expect(selections).toBe(7);
  expect(s.run).toMatchObject({phase:'victory',wave:16,victories:15});
  expect(s.engine.state.phase).toBe('paused');
  expect(s.run.owned).not.toEqual({});
  const fresh=new OmegaProtocolCombatSession(20261108,10);
  expect(fresh.run.owned).toEqual({});
  expect(fresh.run.hp).toBe(100);
  expect(fresh.engine.state.activePerks).not.toEqual(s.engine.state.activePerks);
 });

 it('exposes the genuine Watch cooldown dash instead of a cosmetic animation',()=>{
  const s=new OmegaProtocolCombatSession(1701,10);
  s.update(1/60,{moveX:1,moveY:0,triggerAction:true});
  const before={x:s.engine.state.player.x,cooldown:s.engine.state.player.dashCooldown};
  expect(s.dash()).toBe(true);
  expect(s.dash()).toBe(false);
  expect(s.engine.state.player.isDashing).toBe(true);
  expect(s.engine.state.player.dashCooldown).toBeGreaterThan(before.cooldown??0);
  s.update(1/60,{moveX:1,moveY:0,triggerAction:true});
  expect(s.engine.state.player.x).toBeGreaterThan(before.x);
  s.pause();
  expect(s.dash()).toBe(false);
  expect(s.ultimate()).toBe(false);
 });
 it('applies unstable ground to movement input only in that run, without mutating player speed',()=>{
  const input={moveX:1,moveY:0,triggerAction:false};
  const slowSeed=Array.from({length:120},(_,i)=>i+1).find(seed=>omegaWavePlan(seed,1).modifier==='unstable_ground');
  const normalSeed=Array.from({length:120},(_,i)=>i+1).find(seed=>omegaWavePlan(seed,1).modifier==='standard');
  expect(slowSeed).toBeDefined();expect(normalSeed).toBeDefined();
  const slow=new OmegaProtocolCombatSession(slowSeed!,10),normal=new OmegaProtocolCombatSession(normalSeed!,10);
  const initialSpeed=slow.engine.state.player.speed;
  slow.update(1/30,input);normal.update(1/30,input);
  expect(slow.engine.state.player.speed).toBe(initialSpeed);
  const slowTravel=slow.engine.state.player.x-700;
  const normalTravel=normal.engine.state.player.x-700;
  expect(slowTravel).toBeGreaterThan(0);
  expect(slowTravel).toBeLessThan(normalTravel);
 });
 it('prevents one repeatedly contacting ultimate projectile from deleting the actual protocol boss',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10);
  for(let w=1;w<9;w++){
   clearWave(s);
   if(s.run.phase==='reward')s.selectUpgrade(s.run.offers[0]!);
  }
  expect(s.run.wave).toBe(9);
  const boss=s.engine.state.hazards.find(h=>h.isStageBoss);
  expect(boss).toBeDefined();
  if(!boss)throw new Error('Boss wave failed');
  const hero=s.engine.state.player;
  hero.invincibleTime=999;
  boss.x=hero.x+20;boss.y=hero.y;boss.speed=0;
  // Ordinary hazards are eliminated by the ultimate; leave the boss close
  // so its expanding wave makes many repeated overlap tests.
  s.engine.state.ultimateCharge=s.engine.state.maxUltimateCharge;
  const fullHp=boss.hp;
  expect(s.ultimate()).toBe(true);
  expect(s.ultimate()).toBe(false);
  for(let tick=0;tick<110;tick++)s.update(1/60,idle);
  expect(boss.maxHp).toBe(fullHp);
  expect(boss.hp).toBeGreaterThan(fullHp*.55);
  expect(s.run.phase).toBe('battle');
 });
 it('settles actual damage/defeat and supports non-paying leave and pause',()=>{
  const s=new OmegaProtocolCombatSession(19,10);
  s.pause();
  expect(s.engine.state.phase).toBe('paused');
  const pausedAt=s.engine.state.gameTime;
  s.update(1,idle);
  expect(s.engine.state.gameTime).toBe(pausedAt);
  s.resume();
  s.engine.state.player.hp=0;
  s.update(1/60,idle);
  expect(s.run).toMatchObject({phase:'defeat',hp:0});
  expect(()=>s.selectUpgrade('radio_overdrive')).toThrow();
  const next=new OmegaProtocolCombatSession(20,10);
  next.abandon();
  expect(next.run.phase).toBe('defeat');
  expect(next.run.offers).toEqual([]);
  expect(next.run.owned).toEqual({});
 });
});
