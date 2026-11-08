import {describe,it,expect} from 'vitest';
import {
 omegaCreateBossTelegraph,omegaAdvanceBossTelegraph,omegaBossInStrikeZone,
} from '../src/engine/omega-protocol-boss-pattern';
import {OmegaProtocolCombatSession} from '../src/engine/omega-protocol-combat';

const zero={moveX:0,moveY:0,triggerAction:false};
/** Advance with bounded real-game frames, never feeding a 1.55s hitch into
 * the production boss timer (which correctly rejects frame deltas > 0.25s).
 * A 5ms buffer avoids floating-point drift at an exact phase boundary. */
function advanceBossFrames(
 initial:ReturnType<typeof omegaCreateBossTelegraph>,seconds:number,
 actor:{x:number;y:number},hpFraction:number,
){
 let state=initial,hit=false,wentToStrike=false,remaining=seconds+0.005;
 while(remaining>1e-8){
  const dt=Math.min(0.2,remaining);
  const result=omegaAdvanceBossTelegraph(state,dt,actor,hpFraction);
  state=result.next;hit=hit||result.hit;wentToStrike=wentToStrike||result.wentToStrike;
  remaining-=dt;
 }
 return {next:state,hit,wentToStrike};
}
function toWave(s:OmegaProtocolCombatSession,target:number){
 while(s.run.wave<target){
  s.engine.state.hazards=[];
  s.update(1/60,zero);
  const field=s.field;
  if(!field)throw Error('missing field');
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
describe('OMEGA PROTOCOL boss warning/strike combat acceptance',()=>{
 it('wave 9 is a targeted crane drop; wave 15 is a lane sweep',()=>{
  const a=omegaCreateBossTelegraph(9,{x:500,y:400});
  const b=omegaCreateBossTelegraph(15,{x:500,y:400});
  expect(a).toMatchObject({attack:'crane_drop',phase:'warning',wave:9});
  expect(b).toMatchObject({attack:'power_sweep',phase:'warning',wave:15,lane:'horizontal'});
  expect(omegaBossInStrikeZone(a,{x:500,y:400})).toBe(true);
  expect(omegaBossInStrikeZone(a,{x:500,y:600})).toBe(false);
  expect(omegaBossInStrikeZone(b,{x:1000,y:400})).toBe(true);
  expect(omegaBossInStrikeZone(b,{x:500,y:600})).toBe(false);
  expect(omegaCreateBossTelegraph(15,{x:500,y:400},.35,1).lane).toBe('vertical');
 });
 it('warns for at least 1.15 seconds before the ONLY one-time strike',()=>{
  const actor={x:500,y:400};
  let state=omegaCreateBossTelegraph(9,actor);
  const start=state.warningDuration;
  let hits=0,transitions=0,elapsed=0;
  for(let i=0;i<50;i++){
   const v=omegaAdvanceBossTelegraph(state,.05,actor,1);
   state=v.next;elapsed+=.05;
   if(v.hit)hits++;
   if(v.wentToStrike)transitions++;
   if(transitions)break;
  }
  expect(elapsed).toBeGreaterThanOrEqual(start);
  expect(hits).toBe(1);
  expect(state.phase).toBe('strike');
  for(let i=0;i<5;i++){
   const v=omegaAdvanceBossTelegraph(state,.05,actor,1);
   expect(v.hit).toBe(false);state=v.next;
  }
  expect(state.phase).toBe('recovery');
 });
 it('does not home in after warning or hit heroes outside attack geometry',()=>{
  const a={x:500,y:400};
  const initial=omegaCreateBossTelegraph(9,a);
  const moved={x:900,y:650};
  const v=advanceBossFrames(initial,initial.warningDuration,moved,1);
  expect(v.wentToStrike).toBe(true);
  expect(v.hit).toBe(false);
  expect(v.next.center).toEqual(a);
  expect(()=>omegaAdvanceBossTelegraph(initial,NaN,a,1)).toThrow(RangeError);
  expect(()=>omegaCreateBossTelegraph(9,{x:Infinity,y:5})).toThrow(RangeError);
 });
 it('re-locks new warnings and speeds up at half boss HP without zero warning time',()=>{
  let p=omegaCreateBossTelegraph(15,{x:300,y:200},.8);
  p=advanceBossFrames(p,p.warningDuration,{x:300,y:200},.8).next;
  p=omegaAdvanceBossTelegraph(p,.20,{x:300,y:200},.8).next;
  expect(p.phase).toBe('recovery');
  const moved={x:800,y:680};
  p=advanceBossFrames(p,p.timer,moved,.4).next;
  expect(p).toMatchObject({phase:'warning',empowered:true,attackNumber:1,lane:'vertical'});
  expect(p.center).toEqual(moved);
  expect(p.warningDuration).toBeGreaterThanOrEqual(1.15);
 });
 it('has no silent boss contact damage and applies one real warned hit only once',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  toWave(s,9);
  const boss=s.engine.state.hazards.find(h=>h.isStageBoss);
  expect(boss).toBeDefined();
  if(!boss)throw new Error('Missing wave-nine boss');
  // Ensure no surrounding enemies can contaminate the contact hit test.
  s.engine.state.hazards=[boss];
  const hero=s.engine.state.player;
  const center=s.snapshot.bossTelegraph!.center;
  hero.x=center.x;hero.y=center.y;
  hero.invincibleTime=0;hero.regenRate=0;
  boss.x=hero.x;boss.y=hero.y;boss.speed=0;
  boss.hp=100000;boss.maxHp=100000;
  const full=hero.hp;
  // Before warning expires, standing beside the boss cannot cause damage.
  for(let i=0;i<80;i++){
   boss.x=hero.x;boss.y=hero.y;
   s.update(1/60,zero);
  }
  expect(hero.hp).toBe(full);
  // After the public warning, the same live HP changes once only.
  for(let i=0;i<30;i++){
   boss.x=hero.x;boss.y=hero.y;
   s.update(1/60,zero);
  }
  expect(hero.hp).toBe(full-12);
  expect(s.engine.state.lastDamage).toMatchObject({source:'CRANE_BOSS',amount:12});
  const afterStrike=hero.hp;
  for(let i=0;i<14;i++){
   boss.x=hero.x;boss.y=hero.y;
   s.update(1/60,zero);
  }
  expect(hero.hp).toBe(afterStrike);
 });
 it('the real wave-nine session creates a timed boss warning, then clears it on defeat',()=>{
  const s=new OmegaProtocolCombatSession(20261108,10,false,{fieldTraversal:true});
  toWave(s,9);
  const first=s.snapshot;
  expect(first.run.wave).toBe(9);
  expect(first.bossTelegraph).toMatchObject({wave:9,phase:'warning'});
  expect(s.engine.state.hazards.some(h=>h.isStageBoss)).toBe(true);
  const boss=s.engine.state.hazards.find(h=>h.isStageBoss)!;
  // Decouple own boss contact to measure deterministic warning damage.
  boss.x=1300;boss.y=850;boss.speed=0;
  const hp=s.engine.state.player.hp;
  s.engine.state.player.invincibleTime=999;
  for(let i=0;i<100;i++)s.update(1/60,zero);
  expect(s.engine.state.player.hp).toBe(hp);
  s.engine.state.player.hp=0;
  s.update(1/60,zero);
  expect(s.run.phase).toBe('defeat');
  expect(s.interact().success).toBe(false);
 });
});
