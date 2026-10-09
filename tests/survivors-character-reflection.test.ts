import {describe,it,expect} from 'vitest';
import {characterReflection,hasPlayerHandoffScene,playerHandoffSceneRecord} from '../src/app/survivors-character-reflection';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
import {operationHandoff} from '../src/domain/survivors-operation-handoff';
import {createInitialSurvivorsState} from '../src/engine/patrol-survivors-engine';
const record:OperationHandoff={version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:2,cartStops:1,rubbleCleared:3,damageTaken:0,stars:[true,true,false]};
describe('character reflection',()=>{
 it('retains the stage12 scene after another stage without treating it as current evidence',()=>{
  const rows=[record,{...record,stageId:'stage_13' as const,stageNumber:13}];
  expect(characterReflection(rows,'player')?.record.stageNumber).toBe(13);
  expect(playerHandoffSceneRecord(rows)?.stageNumber).toBe(12);
  expect(playerHandoffSceneRecord([{...record,characterId:'lim_junho'}])).toBeNull();
 });
 it('shows the approved scene only for the matching observed handoff',()=>{
  expect(hasPlayerHandoffScene(record)).toBe(true);
  for(const row of [{...record,characterId:'lim_junho' as const},{...record,rubbleCleared:0},{...record,outcome:'defeat' as const},{...record,stageId:'stage_13' as const,stageNumber:13}])expect(hasPlayerHandoffScene(row)).toBe(false);
 });
 it('projects only observed evidence without changing records',()=>{
  const rows=[record],before=JSON.stringify(rows);
  expect(characterReflection(rows,'player')?.evidence).toEqual(['route','stop','zone']);
  expect(JSON.stringify(rows)).toBe(before);
 });
 it('does not invent achievements from a clear or attribute another actor',()=>{
  expect(characterReflection([{...record,zones:0,cartStops:0,rubbleCleared:0}],'player')?.evidence).toEqual([]);
  expect(characterReflection([record],'lim_junho')).toBeNull();
 });
 it('retains actual actions after interruption without treating it as victory',()=>{
  const result=characterReflection([{...record,outcome:'defeat'}],'player');
  expect(result?.evidence).toEqual(['route','stop','zone','retry']);
  expect(result?.record.outcome).toBe('defeat');
 });
 it('uses latest valid record and rejects malformed stage provenance',()=>{
  const rows=[record,{...record,stageNumber:13},{...record,stageId:'stage_13' as const,stageNumber:13,rubbleCleared:0}];
  expect(characterReflection(rows,'player')?.record.stageId).toBe('stage_13');
  expect(characterReflection([record,{...record,stageNumber:13}],'player')?.record.stageNumber).toBe(12);
 });
 it('reads the existing engine handoff without a new growth state',()=>{
  const state=createInitialSurvivorsState('lim_junho');
  state.phase='defeat';
  const handoff=operationHandoff(state)!;
  expect(characterReflection([handoff],'lim_junho')?.evidence).toContain('retry');
  expect(characterReflection([handoff],'player')).toBeNull();
 });
});
