import { expect, it } from 'vitest';
import { SurvivorsEngine, createInitialSurvivorsState, PATROL_STAGES } from '../src/engine/patrol-survivors-engine';
const idle={moveX:0,moveY:0};
it('flammable store isolation resolves exposure without explosion or player self-damage',()=>{
 const e=new SurvivorsEngine();e.start();e.state.player.critRate=0;
 const store=e.state.interactiveHazards.find(h=>h.type==='explosive_barrel')!;
 e.state.player.x=store.x;e.state.player.y=store.y;const hp=e.state.player.hp;
 e.state.hazards.push({id:'worker',type:'UNHELMETED',x:store.x+100,y:store.y,hp:150,maxHp:150,speed:0,radius:5,damage:0,expValue:1});
 store.state='warning';store.timer=0.01;e.update(1/60,idle);
 expect(e.state.player.hp).toBe(hp);expect(e.state.environmentalKills).toBe(1);
 expect(e.state.projectiles.some(p=>p.id.startsWith('barrel_blast'))).toBe(false);
 expect(e.state.resolvedWorkers?.some(w=>w.id==='worker')).toBe(true);
 expect(e.drainAudioEvents().some(ev=>ev.type==='control')).toBe(true);
});
it('uncontrolled lifting danger never rewards exposing workers; a warned zone can be stopped by a signal',()=>{
 const make=()=>{const e=new SurvivorsEngine(createInitialSurvivorsState('player',undefined,'stage_03'));e.start();e.state.player.critRate=0;
 const zone=e.state.interactiveHazards.find(h=>h.type==='crane_drop_zone')!;zone.state='warning';zone.timer=0.01;
 e.state.hazards.push({id:'exposed',type:'UNHELMETED',x:zone.x,y:zone.y,hp:10000,maxHp:10000,speed:0,radius:10,damage:0,expValue:0});return {e,zone};};
 const unsafe=make();unsafe.e.update(1/60,idle);expect(unsafe.e.state.environmentalKills).toBe(0);expect(unsafe.e.state.hazards.find(h=>h.id==='exposed')?.hp).toBe(10000);
 const safe=make();safe.zone.timer=1;
 safe.e.state.projectiles.push({id:'signal',kind:'radio',x:safe.zone.x,y:safe.zone.y,vx:0,vy:0,radius:10,damage:1,duration:1,pierce:99});
 safe.e.update(1/60,idle);expect(safe.zone.state).toBe('cooldown');expect(safe.e.state.environmentalKills).toBe(1);
});
it('controlled worker resumes along the safety corridor and legacy IDs retain compatible star fields',()=>{
 const e=new SurvivorsEngine();e.start();e.state.resolvedWorkers=[{id:'safe',x:300,y:200,remaining:3}];e.update(1/60,idle);
 expect(e.state.resolvedWorkers[0]!.x).toBeGreaterThan(300);expect(e.state.resolvedWorkers[0]!.y).toBeLessThan(200);
 expect(PATROL_STAGES.stage_01.description).not.toMatch(/유폭|섬멸/);expect(PATROL_STAGES.stage_03.description).not.toMatch(/압살|유인/);
 expect(PATROL_STAGES.stage_01.starChallenges[1].targetValue).toBe(5);
});
