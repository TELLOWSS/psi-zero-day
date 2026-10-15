import {describe,it,expect} from 'vitest';
import {zeroBreachContent as content} from '../src/content/defense';
import {defensePlanningWave, recommendDefenseAction} from '../src/app/defense-tactics';
import {applyDefenseCommand,createDefenseRun,tickDefense} from '../src/engine/defense';
import {isDefenseRunState,encodeDefenseSave,inspectDefenseSave,emptyDefenseSaveDocument} from '../src/app/defense-save';

describe('defense tactical advice through real commands',()=>{
 it('previews the next wave during combat and does not repeat the final wave as a future threat',()=>{
  const initial=createDefenseRun(content,'COORDINATOR');
  expect(defensePlanningWave(content,initial)?.id).toBe(1);
  expect(defensePlanningWave(content,{...initial,status:'RUNNING'})?.id).toBe(2);
  expect(defensePlanningWave(content,{...initial,status:'INTERMISSION',waveId:6})?.id).toBe(6);
  expect(defensePlanningWave(content,{...initial,status:'RUNNING',waveId:10})).toBeNull();
 });
 it('only recommends affordable legal commands on usable pads and never edits the input',()=>{
  let run=createDefenseRun(content,'COORDINATOR');
  const copy=JSON.stringify(run),advice=recommendDefenseAction(content,run)!;
  expect(JSON.stringify(run)).toBe(copy);
  expect(advice.cost).toBeLessThanOrEqual(run.resource);
  run=applyDefenseCommand(run,content,advice.command);
  expect(run.resource).toBe(content.initialResource-advice.cost);
  expect(recommendDefenseAction(content,{...run,resource:0})).toBeNull();
  expect(recommendDefenseAction(content,{...run,status:'WON'})).toBeNull();
  const limited={...content,scenario:{...content.scenario,availableTowers:['PULSE' as const]}};
  expect(recommendDefenseAction(limited,createDefenseRun(limited,'COORDINATOR'))?.towerId).toBe('PULSE');
 });
 for(const support of ['COORDINATOR','OBSERVER'] as const)it(`completes all ten waves with ${support}, actual advice, spending and support; no state/resource injection`,()=>{
  let run=createDefenseRun(content,support),steps=0,actions=0;
  while(run.status!=='WON'&&run.status!=='LOST'&&steps++<20000){
   if(run.status==='READY'||run.status==='INTERMISSION'){
    for(let n=0;n<30;n++){
     const advice=recommendDefenseAction(content,run);if(!advice)break;
     run=applyDefenseCommand(run,content,advice.command);actions++;
    }
    run=applyDefenseCommand(run,content,{type:'StartWave'});
   }
   if(run.status==='RUNNING'&&run.enemies.length&&run.supportCooldownRemaining===0)run=applyDefenseCommand(run,content,{type:'UseSupport'});
   run=tickDefense(run,content);
  }
  expect(actions).toBeGreaterThan(4);
  expect(run.resource).toBeGreaterThanOrEqual(0);
  expect(run.completedWaves,JSON.stringify({shield:run.shield,leaks:run.leakedByEnemy,towers:run.towers})).toBe(10);
  expect(run.status).toBe('WON');
 });
 it('enforces E-Stop cooldown in the engine and preserves it through validated save/reload, while legacy fields remain optional',async()=>{
  const initial=applyDefenseCommand(createDefenseRun(content,'COORDINATOR'),content,{type:'StartWave'});
  const run=applyDefenseCommand(initial,content,{type:'TriggerEStop'});
  expect(()=>applyDefenseCommand(run,content,{type:'TriggerEStop'})).toThrow('cooling down');
  const serialized=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,0);
  const loaded=await inspectDefenseSave({read:async()=>serialized,write:async()=>{},remove:async()=>{},keys:async()=>[]},content);
  expect(loaded.kind).toBe('ready');
  if(loaded.kind==='ready')expect(()=>applyDefenseCommand(loaded.document.activeRun!,content,{type:'TriggerEStop'})).toThrow('cooling down');
  expect(isDefenseRunState(initial)).toBe(true);
  expect(isDefenseRunState({...run,eStopCooldownUntilTick:-1})).toBe(false);
  expect(isDefenseRunState({...run,eStopCooldownUntilTick:Infinity})).toBe(false);
 });
});
