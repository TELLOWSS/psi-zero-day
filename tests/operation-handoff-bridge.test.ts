import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {operationHandoff} from '../src/domain/survivors-operation-handoff';
import {isOperationHandoff} from '../src/domain/operation-handoff-validation';
import {resolveHandoffCarry} from '../src/domain/survivors-handoff-carry';
import {terrainContains} from '../src/engine/survivors-terrain';
import {handoffDefenseBuild,handoffStoryAction} from '../src/app/operation-handoff-bridge';
import {zeroBreachContent} from '../src/content/defense';
import {applyDefenseCommand,createDefenseRun,tickDefense} from '../src/engine/defense';
import type {StrategyAction} from '../src/app/strategy-actions';
import {projectStrategyActions} from '../src/app/strategy-actions';
import {EpisodeSession} from '../src/app/episode-session';

function completed() {
 const state=createInitialSurvivorsState('player',undefined,'stage_12');
 state.phase='victory';state.terrain!.find(t=>t.kind==='rubble')!.hp=0;state.terrainRecord!.rubbleCleared=1;
 return operationHandoff(state)!;
}
describe('verified operation bridges',()=>{
 it('holds the intermission countdown through the existing pause command while reading',()=>{
  const state={...createDefenseRun(zeroBreachContent,'COORDINATOR'),status:'INTERMISSION' as const,intermissionRemaining:1};
  const paused=applyDefenseCommand(state,zeroBreachContent,{type:'SetPaused',paused:true});
  expect(tickDefense(paused,zeroBreachContent)).toEqual(paused);
  expect(handoffDefenseBuild(completed(),zeroBreachContent,paused)).not.toBeNull();
 });
 it('opens the receiving route physically, without new clear credit or inherited evidence',()=>{
  const record=completed(),original=createInitialSurvivorsState('player',undefined,'stage_13');
  const next=createInitialSurvivorsState('player',undefined,'stage_13',undefined,undefined,[record]);
  const rubble=next.terrain!.find(t=>t.kind==='rubble')!,point={x:rubble.x+5,y:rubble.y+5};
  expect(terrainContains(original.terrain!.find(t=>t.id===rubble.id)!,point)).toBe(true);
  expect(terrainContains(rubble,point)).toBe(false);
  expect(next.terrainRecord!.rubbleCleared).toBe(0);expect(next.psiCredits).toBe(original.psiCredits);
  next.phase='victory';expect(operationHandoff(next)!.clearedTerrainIds).toEqual([]);
  expect(createInitialSurvivorsState('player',undefined,'stage_13',undefined,undefined,[record]).terrain).toEqual(next.terrain);
 });
 it('rejects stale victories, counts without IDs, unrelated sites and malformed evidence',()=>{
  const record=completed();expect(resolveHandoffCarry([record,{...record,outcome:'defeat'}],'stage_13')).toBeNull();
  expect(resolveHandoffCarry([{...record,clearedTerrainIds:undefined}],'stage_13')).toBeNull();
  expect(isOperationHandoff({...record,clearedTerrainIds:undefined})).toBe(true);
  expect(resolveHandoffCarry([record],'stage_14')).toBeNull();
  expect(resolveHandoffCarry([{...record,clearedTerrainIds:['terrain_other']}],'stage_13')).toBeNull();
  expect(isOperationHandoff({...record,clearedTerrainIds:['terrain_rubble','terrain_rubble']})).toBe(false);
  expect(isOperationHandoff({...record,rubbleCleared:0})).toBe(false);
 });
 it('uses an existing enabled inspect choice, never invents evidence or a choice',()=>{
  const action:StrategyAction={event_id:'e',instance_id:'i',node_id:'n',choice_id:'c',label_text_id:'label',enabled:true,intent:'inspect',target:{kind:'anchor',anchor:'entry'},actor_character_id:'player',resource_axes:[]};
  expect(handoffStoryAction(completed(),[action])).toBe(action);
  expect(handoffStoryAction(completed(),[{...action,enabled:false}])).toBeNull();
  expect(handoffStoryAction(completed(),[{...action,intent:'record'}])).toBeNull();
  expect(handoffStoryAction(completed(),[])).toBeNull();
 });
 it('builds through the real defense command, charges cost, and stops duplicate recommendations',()=>{
  const state=createDefenseRun(zeroBreachContent,'COORDINATOR');
  const plan=handoffDefenseBuild(completed(),zeroBreachContent,state)!;
  expect(plan.command.towerId).toBe('CONTROL');
  const next=applyDefenseCommand(state,zeroBreachContent,plan.command);
  expect(next.resource).toBe(state.resource-plan.cost);expect(next.towers).toHaveLength(1);
  expect(handoffDefenseBuild(completed(),zeroBreachContent,next)).toBeNull();
  expect(handoffDefenseBuild(completed(),zeroBreachContent,{...state,resource:0})?.affordable).toBe(false);
  expect(handoffDefenseBuild(completed(),zeroBreachContent,{...state,status:'RUNNING'})).toBeNull();
 });
 it('executes an authored story inspection through EpisodeSession with normal revision checks',()=>{
  const session=new EpisodeSession();session.start(0);
  for(let step=0;step<100;step++){
   const snapshot=session.getSnapshot(),p=snapshot.presentation.find(c=>'node_id' in c);
   if(!p){const finished=snapshot.state?.event_runtime.finished_instances.at(-1);if(!finished)break;session.confirmFieldOutcome(finished.instance_id,snapshot.revision);continue;}
   if(p.type==='SHOW_CHOICE'){
    const action=handoffStoryAction(completed(),projectStrategyActions(snapshot.strategy?.runtime.active_event_id??null,p));
    if(action){
     const command={type:'choose_event' as const,instance_id:action.instance_id,node_id:action.node_id,choice_id:action.choice_id};
     expect(session.dispatch(command,snapshot.revision)).toBe(true);
     expect(session.getSnapshot().state?.event_runtime.choice_history.at(-1)?.choice_id).toBe(action.choice_id);
     expect(session.dispatch(command,snapshot.revision)).toBe(false);return;
    }
    const choice=p.choices.find(c=>c.enabled)!;session.dispatch({type:'choose_event',instance_id:p.instance_id,node_id:p.node_id,choice_id:choice.choice_id},snapshot.revision);
   }else if(p.type==='SHOW_DIALOGUE'||p.type==='SHOW_RESULT')session.dispatch({type:'advance_event',instance_id:p.instance_id,node_id:p.node_id},snapshot.revision);
  }
  throw Error('Expected an authored inspect action');
 });
});
