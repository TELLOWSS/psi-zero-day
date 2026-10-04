import {expect,it} from 'vitest';
import {operationPlan,operationProgress} from '../src/engine/survivors-operation';
import {PATROL_STAGES,SurvivorsEngine,createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
it('varies operation rhythm and only asks for authored controllable zones',()=>{
 expect(new Set(Object.values(PATROL_STAGES).map(s=>operationPlan(s).mode)).size).toBe(3);
 for(const s of Object.values(PATROL_STAGES)){
  const p=operationPlan(s);expect(p.earliest).toBeGreaterThanOrEqual(90);expect(p.earliest).toBeLessThan(180);
  expect(p.zones).toBeLessThanOrEqual(s.hazards.filter(h=>['explosive_barrel','electric_transformer','crane_drop_zone'].includes(h.type)).length);
 }
});
it('requires actual boss, current zone control, response count and minimum patrol together',()=>{
 const s=createInitialSurvivorsState();const p=operationPlan(s.stage);
 s.gameTime=p.earliest;s.hazardsNeutralized=p.controls;
 expect(operationProgress(s).complete).toBe(false);s.stageBossNeutralized=true;
 expect(operationProgress(s).complete).toBe(false);
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='active';
 expect(operationProgress(s).complete).toBe(true);
 s.gameTime=p.earliest-1;expect(operationProgress(s).complete).toBe(false);
});
it('finishes via engine rules and awards terminal rewards only once',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=100;s.stageBossSpawned=true;s.stageBossNeutralized=true;s.hazardsNeutralized=100;
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='active';
 expect(e.requestHandoff()).toBe(true);
 for(let i=0;i<250;i++)e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('victory');const score=s.score;e.update(1/60,{moveX:0,moveY:0});expect(s.score).toBe(score);
});
it('retains the survival route when objectives remain incomplete',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=180;e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('victory');expect(operationProgress(s).complete).toBe(false);
});
