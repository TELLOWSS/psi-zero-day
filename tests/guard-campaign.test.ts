import {describe,it,expect} from 'vitest';
import {guardFoundationContents as guardContents,guardStageUnlocked,guardSupportUnlocked} from '../src/content/guard-campaign';
import {advanceDefense,applyDefenseCommand,createDefenseRun,defenseResult} from '../src/engine/defense';
import {recommendDefenseAction} from '../src/app/defense-tactics';
import {decodeDefenseSave,encodeDefenseSave,emptyDefenseSaveDocument,applyDefenseOutcome} from '../src/app/defense-save';
import type {DefenseRunState} from '../src/domain/defense';

describe('independent guard campaign',()=>{
 it('has three real geometries with 6/7/8 waves and an independent one-clear unlock chain',()=>{
  expect(guardContents.map(c=>c.waves.length)).toEqual([6,7,8]);expect(new Set(guardContents.map(c=>JSON.stringify(c.map.path))).size).toBe(3);
  const doc=emptyDefenseSaveDocument();expect(guardStageUnlocked(guardContents[0]!.scenario.id,doc)).toBe(true);expect(guardStageUnlocked(guardContents[1]!.scenario.id,doc)).toBe(false);
  expect(guardSupportUnlocked('REBAR_LEAD',doc)).toBe(false);expect(guardSupportUnlocked('ENGINEER',doc)).toBe(false);
 });
 it.each(guardContents.map((c,i)=>[i+1,c] as const))('normally buys, evolves and supports through GD-%s',(_i,content)=>{
  for(const support of ['COORDINATOR','OBSERVER','REBAR_LEAD','ENGINEER'] as const){
   let run=createDefenseRun(content,support,`qa-${content.scenario.id}-${support}`);let ticks=0;
   while(!['WON','LOST'].includes(run.status)&&ticks<40000){
    if(run.status==='READY'||run.status==='INTERMISSION'){
     for(let i=0;i<40;i++){const advice=recommendDefenseAction(content,run);if(!advice)break;run=applyDefenseCommand(run,content,advice.command);}
     run=applyDefenseCommand(run,content,{type:'StartWave'});
    }
    if(run.supportCooldownRemaining===0){try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{/* no eligible support target */}}
    run=advanceDefense(run,content);ticks++;
   }
   if(run.status!=='WON')console.log(JSON.stringify({stage:content.scenario.id,wave:run.waveId,support,leaks:run.leakedByEnemy,towers:run.towers}));
   expect({support,status:run.status,shield:run.shield,ticks}).toMatchObject({support,status:'WON'});
   const decoded=decodeDefenseSave(encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},content,1));expect(decoded?.payload.activeRun?.supportId).toBe(support);
   const settled=applyDefenseOutcome(emptyDefenseSaveDocument(),content,run,defenseResult(run),'2026-10-15');expect(settled.document.records[0]?.clears).toBe(1);
  }
 });
 it('keeps new optional state fields serializable without changing legacy run requirements',()=>{
  const c=guardContents[0]!,run={...createDefenseRun(c,'REBAR_LEAD','x'),status:'RUNNING'} as DefenseRunState;
  const encoded=encodeDefenseSave({...emptyDefenseSaveDocument(),activeRun:run},c,1);expect(decodeDefenseSave(encoded)?.payload.activeRun).toEqual(run);
 });
 it.each(['PULSE','BURST','CONTROL'] as const)('allows a %s opening without resource or victory overrides',family=>{
  for(const content of guardContents){
   const outcomes=[];
   for(const initialPad of content.map.pads){
   let run=createDefenseRun(content,'COORDINATOR',`opening-${family}-${content.map.id}`);
   run=applyDefenseCommand(run,content,{type:'Build',towerId:family,padId:initialPad.id});
   for(let ticks=0;!['WON','LOST'].includes(run.status)&&ticks<40000;ticks++){
    if(run.status==='READY'||run.status==='INTERMISSION'){
     for(let i=0;i<40;i++){const advice=recommendDefenseAction(content,run);if(!advice)break;run=applyDefenseCommand(run,content,advice.command);}
     run=applyDefenseCommand(run,content,{type:'StartWave'});
    }
    if(run.supportCooldownRemaining===0){try{run=applyDefenseCommand(run,content,{type:'UseSupport'});}catch{}}
    run=advanceDefense(run,content);
   }
   outcomes.push({pad:initialPad.id,status:run.status,shield:run.shield});if(run.status==='WON')break;
   }
   expect({map:content.map.id,family,winning:outcomes.some(o=>o.status==='WON')}).toMatchObject({winning:true});
  }
 });
});
