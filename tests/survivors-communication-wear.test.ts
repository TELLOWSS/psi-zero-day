import {describe,it,expect} from 'vitest';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
import {communicationWearPlan} from '../src/ui/survivors-communication-wear-plan';
describe('body worn communication selection',()=>{
 it('never invents an equipped weapon or purchase',()=>{
  const state=createInitialSurvivorsState('player');
  expect(communicationWearPlan(state)).toBeUndefined();
  state.activePerks.radio_boost=1;
  const before=JSON.stringify(state);
  expect(communicationWearPlan(state)?.column).toBe(0);
  expect(JSON.stringify(state)).toBe(before);
 });
 it('uses distinct purchase art without duplicating the free radio',()=>{
  for(const [id,column] of [['voice_lens',1],['command_array',2],['broadcast_crown',3]] as const){
   const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:[id],equipped:[id]});state.activePerks.radio_boost=5;
   expect(communicationWearPlan(state)?.column).toBe(column);
   expect(communicationWearPlan(state)?.id).toBe(id);
  }
 });
 it('selects physical side/rear variants and rear occlusion for movement directions',()=>{
  const state=createInitialSurvivorsState('lim_junho');
  expect(communicationWearPlan(state,0)?.cell).toBe(4);
  expect(communicationWearPlan(state,4)?.row).toBe(1);
  expect(communicationWearPlan(state,2)?.row).toBe(0);
  expect(communicationWearPlan(state,6)).toMatchObject({row:2,cell:8,layer:'back'});
 });
});
