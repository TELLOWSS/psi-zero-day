import {expect,it} from 'vitest';
import {operationPlan,operationProgress} from '../src/engine/survivors-operation';
import {PATROL_STAGES,SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
it('varies operation rhythm and only asks for authored controllable zones',()=>{
 expect(new Set(Object.values(PATROL_STAGES).map(s=>operationPlan(s).mode)).size).toBe(3);
 for(const s of Object.values(PATROL_STAGES)){
  const p=operationPlan(s);expect(p.revealAt).toBeGreaterThan(0);expect(p.bossAt).toBe(60);
  expect(p.zones).toBeLessThanOrEqual(s.hazards.filter(h=>['explosive_barrel','electric_transformer','crane_drop_zone'].includes(h.type)).length);
 }
});
it('requires actual boss, current zone control and response count without idle waiting',()=>{
 const s=createInitialSurvivorsState();const p=operationPlan(s.stage);
 s.gameTime=p.bossAt;s.hazardsNeutralized=p.controls;
 expect(operationProgress(s).complete).toBe(false);s.stageBossNeutralized=true;
 expect(operationProgress(s).complete).toBe(false);
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='active';
 expect(operationProgress(s).complete).toBe(true);
 s.gameTime=0;expect(operationProgress(s).complete).toBe(true);
});
it('finishes via engine rules and awards terminal rewards only once',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=100;s.stageBossSpawned=true;s.stageBossNeutralized=true;s.hazardsNeutralized=100;
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='active';
 expect(e.requestHandoff()).toBe(true);
 for(let i=0;i<250;i++)e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('victory');const score=s.score;e.update(1/60,{moveX:0,moveY:0});expect(s.score).toBe(score);
});
it('never grants a time-only victory when objectives remain incomplete',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=180;e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('playing');expect(operationProgress(s).complete).toBe(false);expect(e.drainAudioEvents().some(ev=>ev.type==='win')).toBe(false);
});
it('exposes the map boss when interventions are complete instead of making the player wait a minute',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();
 s.gameTime=16;s.hazardsNeutralized=operationPlan(s.stage).controls;
 s.operationControlledZones=s.interactiveHazards.map(h=>h.id);
 for(let i=0;i<120&&!s.stageBossSpawned;i++)e.update(1/60,{moveX:0,moveY:0});
 expect(s.stageBossSpawned).toBe(true);expect(s.hazards.some(h=>h.isStageBoss&&h.type===s.stage.bossType)).toBe(true);
 expect(s.phase).toBe('playing');
});
