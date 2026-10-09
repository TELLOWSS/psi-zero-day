import {describe,it,expect} from 'vitest';
import {canShowHandoffDialogue,isHandoffDialogueRecord,HANDOFF_DIALOGUE_EVENT} from '../src/domain/survivors-handoff-dialogue';
import {HANDOFF_DIALOGUE_KEY,readHandoffDialogue,saveHandoffDialogue} from '../src/app/handoff-dialogue-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
const handoff:OperationHandoff={version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:0,cartStops:0,rubbleCleared:1,damageTaken:0,stars:[true,false,false]};
function memory(){const values=new Map<string,string>();let writes=0;return {values,get writes(){return writes;},getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{writes++;values.set(key,value);}};}
describe('approved stage12 handoff dialogue',()=>{
 it('requires the exact actor, stage, completion and observed route record',()=>{
  expect(canShowHandoffDialogue(handoff)).toBe(true);
  for(const row of [{...handoff,characterId:'lim_junho' as const},{...handoff,stageId:'stage_13' as const,stageNumber:13},{...handoff,rubbleCleared:0},{...handoff,outcome:'defeat' as const}])expect(canShowHandoffDialogue(row)).toBe(false);
 });
 for(const choice of ['together','explain'] as const)it(`persists ${choice} once and never writes on replay`,()=>{
  const store=memory();store.values.set('wallet','1260');
  expect(saveHandoffDialogue(choice,store)).toBe(true);
  expect(readHandoffDialogue(store)?.choice).toBe(choice);
  expect(saveHandoffDialogue(choice,store)).toBe(true);expect(store.writes).toBe(1);
  expect(saveHandoffDialogue(choice==='together'?'explain':'together',store)).toBe(false);
  expect(store.values.get('wallet')).toBe('1260');expect(store.writes).toBe(1);
 });
 it('rejects corrupt and other-character events without inventing choices',()=>{
  const store=memory();store.values.set(HANDOFF_DIALOGUE_KEY,'{');expect(readHandoffDialogue(store)).toBeNull();
  expect(isHandoffDialogueRecord({version:1,eventId:'lim_junho.stage12.handoff.v1',choice:'together'})).toBe(false);
  expect(isHandoffDialogueRecord({version:2,eventId:HANDOFF_DIALOGUE_EVENT,choice:'explain'})).toBe(false);
 });
 it('reports a failed save and permits a later successful retry',()=>{
  const store=memory();const failing={getItem:store.getItem,setItem:()=>{throw Error('quota');}};
  expect(saveHandoffDialogue('explain',failing)).toBe(false);expect(readHandoffDialogue(store)).toBeNull();
  expect(saveHandoffDialogue('explain',store)).toBe(true);expect(store.writes).toBe(1);
 });
});
