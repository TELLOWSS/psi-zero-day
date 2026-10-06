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
it('finishes on actual boss resolution without additional control quotas or waiting',()=>{
 const s=createInitialSurvivorsState();const p=operationPlan(s.stage);
 s.gameTime=p.bossAt;s.hazardsNeutralized=0;
 expect(operationProgress(s).complete).toBe(false);s.stageBossNeutralized=true;
 expect(operationProgress(s).complete).toBe(true);
 for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='active';
 expect(operationProgress(s).complete).toBe(true);
 s.gameTime=0;expect(operationProgress(s).complete).toBe(true);
});
it('finishes via engine rules and awards terminal rewards only once',()=>{
 for(const stage of Object.values(PATROL_STAGES)){
  const s=createInitialSurvivorsState(undefined,undefined,stage.id);const e=new SurvivorsEngine(s,42);e.start();s.gameTime=60;
  e.update(1/60,{moveX:0,moveY:0});
  const boss=s.hazards.find(h=>h.isStageBoss)!;expect(boss).toBeDefined();boss.hp=0;
  const completionFrames=Math.ceil(((s.bossEncounter!.introDuration??0)+2.4)*60)+10;
  for(let i=0;i<completionFrames;i++)e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('victory');expect(s.stageBossNeutralized).toBe(true);
  expect(s.fieldTactics?.handoff).toBeFalsy();const score=s.score,credits=s.psiCredits;
  e.update(1/60,{moveX:0,moveY:0});expect(s.score).toBe(score);expect(s.psiCredits).toBe(credits);
 }
});
it('never grants a time-only victory when objectives remain incomplete',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();s.gameTime=180;e.update(1/60,{moveX:0,moveY:0});expect(s.phase).toBe('playing');expect(operationProgress(s).complete).toBe(false);expect(e.drainAudioEvents().some(ev=>ev.type==='win')).toBe(false);
});
it('spawns the designated boss at the deadline independently of the ordinary spawn timer',()=>{
 const s=createInitialSurvivorsState(),e=new SurvivorsEngine(s,42);e.start();
 s.gameTime=60;e.update(1/60,{moveX:0,moveY:0});
 expect(s.hazards.filter(h=>h.isStageBoss)).toHaveLength(1);
 for(let i=0;i<30;i++)e.update(1/60,{moveX:0,moveY:0});
 expect(s.hazards.filter(h=>h.isStageBoss)).toHaveLength(1);
});
it('exposes the map boss when interventions are complete instead of making the player wait a minute',()=>{
 const s=createInitialSurvivorsState();const e=new SurvivorsEngine(s,42);e.start();
 s.gameTime=16;s.hazardsNeutralized=operationPlan(s.stage).controls;
 s.operationControlledZones=s.interactiveHazards.map(h=>h.id);
 for(let i=0;i<120&&!s.stageBossSpawned;i++)e.update(1/60,{moveX:0,moveY:0});
 expect(s.stageBossSpawned).toBe(true);expect(s.hazards.some(h=>h.isStageBoss&&h.type===s.stage.bossType)).toBe(true);
 expect(s.phase).toBe('playing');
});
