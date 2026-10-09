import {describe,expect,it} from 'vitest';
import {canChooseNarrativeDirection,isNarrativeDirectionRecord} from '../src/domain/survivors-narrative-direction';
import {NARRATIVE_DIRECTION_KEY,readNarrativeDirection,saveNarrativeDirection} from '../src/app/narrative-direction-store';
import {HANDOFF_DIALOGUE_EVENT} from '../src/domain/survivors-handoff-dialogue';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
const record:OperationHandoff={version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:0,cartStops:0,rubbleCleared:1,damageTaken:0,stars:[true,false,false]};
const dialogue={version:1,eventId:HANDOFF_DIALOGUE_EVENT,choice:'together'} as const;
function memory(){const values=new Map<string,string>();let writes=0;return {values,get writes(){return writes;},getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{writes++;values.set(key,value);}};}
describe('approved mutable narrative interest',()=>{
 it('requires exact observed completion and an approved dialogue choice',()=>{
  expect(canChooseNarrativeDirection(record,dialogue)).toBe(true);
  for(const row of [null,{...record,rubbleCleared:0},{...record,outcome:'defeat' as const},{...record,characterId:'lim_junho' as const},{...record,stageId:'stage_13' as const,stageNumber:13}])expect(canChooseNarrativeDirection(row,dialogue)).toBe(false);
  expect(canChooseNarrativeDirection(record,null)).toBe(false);
 });
 it('allows explicit changes without duplicate writes, rewards or source mutation',()=>{
  const store=memory(),before=JSON.stringify([record,dialogue]);store.values.set('wallet','1260');
  for(const direction of ['control','coordination','investigation'] as const){expect(saveNarrativeDirection(direction,record,dialogue,store)).toBe(true);expect(readNarrativeDirection(store)?.direction).toBe(direction);}
  expect(saveNarrativeDirection('investigation',record,dialogue,store)).toBe(true);expect(store.writes).toBe(3);
  expect(store.values.get('wallet')).toBe('1260');expect(JSON.stringify([record,dialogue])).toBe(before);
 });
 it('blocks invalid prerequisites and corrupt or other-character records',()=>{
  const store=memory();expect(saveNarrativeDirection('control',record,null,store)).toBe(false);expect(store.writes).toBe(0);
  for(const value of ['{',JSON.stringify({version:2,characterId:'player',direction:'control'}),JSON.stringify({version:1,characterId:'lim_junho',direction:'control'})]){store.values.set(NARRATIVE_DIRECTION_KEY,value);expect(readNarrativeDirection(store)).toBeNull();}
  expect(isNarrativeDirectionRecord({version:1,characterId:'player',direction:'job'})).toBe(false);
 });
 it('preserves the previous choice on failure and permits retry',()=>{
  const store=memory();saveNarrativeDirection('control',record,dialogue,store);
  const failure={getItem:store.getItem,setItem:()=>{throw Error('quota');}};
  expect(saveNarrativeDirection('coordination',record,dialogue,failure)).toBe(false);
  expect(readNarrativeDirection(store)?.direction).toBe('control');expect(saveNarrativeDirection('coordination',record,dialogue,store)).toBe(true);
 });
});
