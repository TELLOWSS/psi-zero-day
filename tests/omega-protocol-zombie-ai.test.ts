import {describe,it,expect} from 'vitest';
import type {Hazard} from '../src/domain/patrol-survivors';
import {
 OMEGA_ZOMBIE_KINDS,omegaZombieKindForSlot,omegaCreateZombieBrain,
 omegaAdvanceZombieBrain,omegaZombieThreatLabel,
} from '../src/domain/omega-protocol-zombie-ai';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const infected=(x=100,y=100):Hazard=>({
 id:'native-watch-infected-1',type:'UNHELMETED',x,y,hp:100,maxHp:100,
 speed:90,radius:15,damage:12,expValue:3,
});
describe('OMEGA M03 four independent original hard-hat zombie AI styles',()=>{
 it('spawns all four in each real OMEGA expedition route without rewriting WATCH type',()=>{
  for(const seed of [20261109,31337,777]){
   const run=new OmegaProtocolCombatSession(seed,50,false,{fieldTraversal:true});
   const zombies=run.zombieTelemetry;
   expect(zombies.length).toBeGreaterThanOrEqual(4);
   expect(new Set(zombies.map(z=>z.kind)).size).toBe(4);
   expect(new Set(zombies.slice(0,4).map(z=>z.kind)).size).toBe(4);
   for(const z of zombies){
    const h=run.engine.state.hazards.find(x=>x.id===z.id)!;
    expect(h.type).toBe('UNHELMETED');
    expect(h.speed).toBe(0); // native generic chase disabled
    expect(h.damage).toBe(0); // no unannounced worker collision
   }
   expect(run.engine.state.hazards.some(h=>h.type==='RUNAWAY_CART'||h.type==='CRANE_BOSS'||h.type==='FALLING_DEBRIS'||h.type==='GAS_LEAK')).toBe(true);
  }
 });
 it('uses deterministic 4-kind sector rotation, not 4 palette-only colours',()=>{
  expect(OMEGA_ZOMBIE_KINDS).toEqual(['drifter','sprinter','armored','stalker']);
  expect(omegaZombieKindForSlot(0,1)).toBe('drifter');
  expect(omegaZombieKindForSlot(0,4)).toBe('sprinter');
  expect(omegaZombieKindForSlot(0,7)).toBe('armored');
  expect(omegaZombieKindForSlot(0,10)).toBe('stalker');
  expect(new Set(OMEGA_ZOMBIE_KINDS.map((kind,i)=>omegaZombieThreatLabel(
   omegaCreateZombieBrain(infected(),kind,i)))).size).toBe(4);
  expect(()=>omegaZombieKindForSlot(-1,2)).toThrow();
  expect(()=>omegaZombieKindForSlot(0,16)).toThrow();
 });
 it('armored has significantly more real HP, radius and slower movement than sprinter',()=>{
  const heavy=infected(),rush=infected();
  const armor=omegaCreateZombieBrain(heavy,'armored',2);
  const fast=omegaCreateZombieBrain(rush,'sprinter',1);
  expect(heavy.hp).toBeGreaterThan(rush.hp*3);
  expect(heavy.radius).toBeGreaterThan(rush.radius+10);
  expect(armor.speed).toBeLessThan(fast.speed*.5);
  expect(armor.damage).toBeGreaterThan(fast.damage);
  expect(armor.warningDuration).toBeGreaterThan(fast.warningDuration);
 });
 it.each([
  ['drifter',50],['sprinter',150],['armored',70],['stalker',120],
 ] as const)('%s must visibly warn BEFORE a real attack window', (kind,space)=>{
  const h=infected(200,200);
  const b=omegaCreateZombieBrain(h,kind,0);
  const player={x:200+space,y:200};
  const first=omegaAdvanceZombieBrain(h,b,player,[],.05);
  expect(first.contactDamage).toBe(0);
  expect(b.phase).toBe('warning');
  expect(b.warnings).toBe(1);
  let attacks=0,damage=0;
  for(let i=0;i<40;i++){
   const r=omegaAdvanceZombieBrain(h,b,player,[],.05);
   if(r.attackWindow)attacks++;
   damage+=r.contactDamage;
  }
  expect(b.attacks).toBeGreaterThanOrEqual(1);
  expect(attacks).toBe(1);
  expect(damage).toBe(b.damage);
 });
 it('unique movement: drifter approaches directly; stalker strafes to a FLANK waypoint',()=>{
  const basic=infected(100,140),elite=infected(100,140);
  const b1=omegaCreateZombieBrain(basic,'drifter',0);
  const b2=omegaCreateZombieBrain(elite,'stalker',1);
  const destination={x:460,y:140};
  omegaAdvanceZombieBrain(basic,b1,destination,[],.08);
  omegaAdvanceZombieBrain(elite,b2,destination,[],.08);
  expect(basic.x).toBeGreaterThan(100);
  expect(basic.y).toBeCloseTo(140,5);
  expect(elite.x).toBeGreaterThan(100);
  expect(elite.y).not.toBeCloseTo(140,5);
  expect(Math.abs(elite.y-basic.y)).toBeGreaterThan(1);
 });
 it('real barrier ends the sprinter charge and never grants a wall-through hit',()=>{
  const h=infected(100,220),b=omegaCreateZombieBrain(h,'sprinter',1);
  const player={x:230,y:220};
  const wall=[{id:'container',kind:'container' as const,x:153,y:190,width:42,height:65}];
  omegaAdvanceZombieBrain(h,b,player,wall,.05);
  expect(b.phase).toBe('warning');
  let wallStopped=false,totalDamage=0;
  for(let i=0;i<50;i++){
   const result=omegaAdvanceZombieBrain(h,b,player,wall,.05);
   wallStopped ||=result.collidedWithWall;
   totalDamage+=result.contactDamage;
  }
  expect(wallStopped).toBe(true);
  expect(h.x).toBeLessThanOrEqual(153-h.radius+.01);
  expect(totalDamage).toBe(0);
 });
 it('watch engine and OMEGA zombie actually use warned real HP, no immediate contact damage',()=>{
  const session=new OmegaProtocolCombatSession(20261109,50,false,{fieldTraversal:true});
  const drifter=session.zombieTelemetry.find(z=>z.kind==='drifter')!;
  const h=session.engine.state.hazards.find(x=>x.id===drifter.id)!;
  session.engine.state.hazards=[h];
  session.engine.state.activePerks.radio_boost=0;
  const p=session.engine.state.player;
  p.x=h.x+48;p.y=h.y;p.invincibleTime=0;
  const initial=p.hp;
  session.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  expect(p.hp).toBe(initial);
  expect(session.zombieBrain(h.id)?.phase).toBe('warning');
  for(let i=0;i<55;i++)session.update(1/60,{moveX:0,moveY:0,triggerAction:false});
  expect(p.hp).toBeLessThan(initial);
  expect(session.zombieBrain(h.id)?.hits).toBe(1);
  expect(session.zombieBrain(h.id)?.damageDone).toBeGreaterThan(0);
 });
});
