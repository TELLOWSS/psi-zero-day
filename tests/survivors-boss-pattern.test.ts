import { expect, it } from 'vitest';
import type { Hazard } from '../src/domain/patrol-survivors';
import { advanceBossPhase, bossPattern,bossCoreFloor,bossCoreStatus } from '../src/engine/survivors-boss-pattern';
import { updateHazardMotion, isHazardContactActive } from '../src/engine/patrol-hazard-motion';
import { SurvivorsEngine, createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { craneAttackElevation } from '../src/ui/survivors-industrial-art';

function boss(type:Hazard['type']):Hazard {
 return {id:'boss',type,x:700,y:450,hp:100,maxHp:100,speed:60,radius:34,damage:0,expValue:1,isStageBoss:true,
  variant:type==='GAS_LEAK'?'pulse_gas':undefined,motion:{phase:'approach',timer:0,directionX:0,directionY:0}};
}
const player=createInitialSurvivorsState().player;
it('shares the actual structural floor with readable locked and exposed states',()=>{
 const h=boss('CRANE_BOSS');h.bossEncounterManaged=true;h.hp=50;
 expect(bossCoreFloor(h)).toBe(50);expect(bossCoreStatus(h)).toBe('interlocked');
 h.bossPhase=2;h.hp=8;h.bossAttackCycles=0;expect(bossCoreFloor(h)).toBe(8);expect(bossCoreStatus(h)).toBe('interlocked');
 h.bossAttackCycles=1;h.motion!.phase='spent';expect(bossCoreFloor(h)).toBe(0);expect(bossCoreStatus(h)).toBe('exposed');
 h.motion!.phase='warning';expect(bossCoreStatus(h)).toBe('active');
});
it('reports a locked projectile contact without damage, critical stop or destructive impact audio',()=>{
 const s=createInitialSurvivorsState(),e=new SurvivorsEngine(s,42);e.start();s.stageBossSpawned=true;
 const h=boss('CRANE_BOSS');h.bossEncounterManaged=true;h.bossAttackCycles=0;h.hp=50;h.speed=0;
 s.hazards=[h];s.bossEncounter={bossId:h.id,phase:'combat',remaining:0};s.player.critRate=1;
 s.projectiles=[{id:'blocked',kind:'radio',x:h.x,y:h.y,vx:0,vy:0,radius:10,damage:9999,duration:1,pierce:1}];
 e.update(1/60,{moveX:0,moveY:0});
 expect(h.hp).toBe(50);expect(e.drainProjectileFeedback().find(ev=>ev.projectileId==='blocked'&&ev.phase==='impact')).toMatchObject({blocked:true,critical:false});
 expect(e.drainAudioEvents().some(ev=>ev.type==='impact')).toBe(false);expect(s.hitStopTimer??0).toBe(0);
});
it('renders a continuous final descent and a still reduced-motion load',()=>{
 const h=boss('CRANE_BOSS');h.motion!.phase='warning';h.motion!.timer=1.4;
 expect(craneAttackElevation(h,false)).toBe(70);h.motion!.timer=.15;expect(craneAttackElevation(h,false)).toBe(52.5);
 h.motion!.timer=0;expect(craneAttackElevation(h,false)).toBe(0);expect(craneAttackElevation(h,true)).toBe(0);
 h.motion!.phase='fall';h.motion!.timer=.65;expect(craneAttackElevation(h,false)).toBe(0);
});
it('latches the second phase only outside the active warning or attack and only once',()=>{
 for(const phase of ['warning','charge','fall'] as const){const h=boss('CRANE_BOSS');h.hp=50;h.motion!.phase=phase;expect(advanceBossPhase(h)).toBe(false);expect(h.bossPhase).toBeUndefined();}
 const h=boss('RUNAWAY_CART');h.hp=50;h.motion!.phase='cooldown';h.motion!.timer=.1;
 expect(advanceBossPhase(h)).toBe(true);expect(h.motion!.timer).toBe(1.5);expect(advanceBossPhase(h)).toBe(false);
 h.hp=90;expect(h.bossPhase).toBe(2);
 const normal={...h,isStageBoss:false,bossPhase:undefined};expect(advanceBossPhase(normal)).toBe(false);
});
it('locks crane warnings to the observed workface and attacks only after the full warning',()=>{
 const h=boss('CRANE_BOSS');updateHazardMotion(h,player,.01,60);
 const position=[h.x,h.y];expect(h.motion!.timer).toBe(1.4);expect(isHazardContactActive(h)).toBe(false);
 updateHazardMotion(h,{...player,x:200,y:200},.7,60);expect([h.x,h.y]).toEqual(position);expect(h.motion!.phase).toBe('warning');
 updateHazardMotion(h,player,.7,60);expect(h.motion!.phase).toBe('fall');expect(isHazardContactActive(h)).toBe(true);
 updateHazardMotion(h,player,.65,60);expect(h.motion!.phase).toBe('spent');expect(isHazardContactActive(h)).toBe(false);
 expect(h.motion!.timer).toBe(bossPattern(h).recovery);
});
it('keeps cart headings locked and provides a contact-free braking interval in both phases',()=>{
 for(const phase of [1,2] as const){const h=boss('RUNAWAY_CART');h.bossPhase=phase;h.x=player.x-100;h.y=player.y;
  updateHazardMotion(h,player,.01,60);expect(h.motion!.timer).toBe(1.2);expect(isHazardContactActive(h)).toBe(false);
  updateHazardMotion(h,{...player,y:player.y+100},1.2,60);expect(h.motion!.directionY).toBe(0);expect(isHazardContactActive(h)).toBe(true);
  updateHazardMotion(h,player,1.05,60);expect(h.motion!.phase).toBe('cooldown');expect(isHazardContactActive(h)).toBe(false);expect(h.motion!.timer).toBe(1.5);
 }
});
it('gives gas a real pressure recovery and retains full second-phase warnings',()=>{
 const h=boss('GAS_LEAK');h.bossPhase=2;h.x=player.x;h.y=player.y;
 updateHazardMotion(h,player,.01,60);expect(h.motion!.timer).toBe(1.25);
 updateHazardMotion(h,player,1.25,60);expect(h.motion!.timer).toBe(.9);expect(isHazardContactActive(h)).toBe(true);
 updateHazardMotion(h,player,.9,60);expect(h.motion!.phase).toBe('cooldown');expect(isHazardContactActive(h)).toBe(false);
});
it('does not turn ordinary cranes into staged area bosses',()=>{
 const h=boss('CRANE_BOSS');h.isStageBoss=false;h.motion=undefined;
 expect(updateHazardMotion(h,player,.1,60)).toBe(false);expect(isHazardContactActive(h)).toBe(true);
});
it('preserves the complete braking opportunity when a cart reaches the world boundary',()=>{
 const s=createInitialSurvivorsState(),e=new SurvivorsEngine(s,42);e.start();s.stageBossSpawned=true;
 const h=boss('RUNAWAY_CART');h.bossPhase=2;h.x=1379.9;h.motion={phase:'charge',timer:1,directionX:1,directionY:0};s.hazards=[h];
 e.update(1/60,{moveX:0,moveY:0});expect(h.x).toBe(1380);expect(h.motion.phase).toBe('cooldown');expect(h.motion.timer).toBe(1.5);expect(isHazardContactActive(h)).toBe(false);
});
it('emits exactly one phase cue and prevents knockback from moving an anchored warning',()=>{
 const s=createInitialSurvivorsState(),e=new SurvivorsEngine(s,42);e.start();s.stageBossSpawned=true;
 const h=boss('CRANE_BOSS');h.hp=40;h.motion!.phase='warning';h.motion!.timer=1.4;h.vx=300;h.vy=300;s.hazards=[h];
 e.update(1/60,{moveX:0,moveY:0});expect([h.x,h.y]).toEqual([700,450]);expect(h.bossPhase).toBeUndefined();
 e.drainAudioEvents();h.motion!.phase='spent';h.motion!.timer=2;
 for(let i=0;i<30;i++)e.update(1/60,{moveX:0,moveY:0});
 expect(h.bossPhase).toBe(2);expect(e.drainAudioEvents().filter(ev=>ev.type==='boss_alarm')).toHaveLength(1);
});
