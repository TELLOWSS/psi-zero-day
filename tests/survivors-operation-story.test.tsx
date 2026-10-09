import {afterEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createInitialSurvivorsState,PATROL_STAGES} from '../src/engine/patrol-survivors-engine';
import {operationHandoff} from '../src/domain/survivors-operation-handoff';
import {operationStoryFocus,operationStoryIntermission,operationStoryMemory,operationStoryResult} from '../src/app/survivors-operation-story';
import {SurvivorsOperationStoryResult} from '../src/ui/SurvivorsOperationStory';
import {SurvivorsContainerShop} from '../src/ui/SurvivorsContainerShop';
import type {CharacterId} from '../src/domain/patrol-survivors';

const actors:CharacterId[]=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
afterEach(()=>vi.restoreAllMocks());
describe('character operation story grounded in existing interventions',()=>{
 it('selects available role goals for all six actors, falling back when cart threats are absent',()=>{
  expect(actors.map(id=>operationStoryFocus(id,PATROL_STAGES.stage_12))).toEqual(['zone','route','stop','zone','stop','zone']);
  const noCart={...PATROL_STAGES.stage_12,hazardMix:[],bossType:'CRANE_BOSS' as const};
  expect(operationStoryFocus('lim_junho',noCart)).toBe('route');
 });
 it('uses actual counters, separates defeat from a completed action, and never changes rewards',()=>{
  for(const characterId of actors){
   const state=createInitialSurvivorsState(characterId,undefined,'stage_12');state.phase='defeat';
   state.terrainRecord!.cartStops=2;state.terrainRecord!.rubbleCleared=1;state.operationControlledZones=['actual-zone'];
   const before=JSON.stringify(state),record=operationHandoff(state)!;
   expect(operationStoryResult(record,state.stage)).toMatchObject({facts:{route:1,stop:2,zone:1},fulfilled:true,retry:true});
   expect(renderToStaticMarkup(<SurvivorsOperationStoryResult record={record} stage={state.stage}/>)).toContain('지난 대응이 끝나지 않았습니다');
   expect(JSON.stringify(state)).toBe(before);
  }
 });
 it('does not report unperformed, invalid or unrelated-stage actions as achieved',()=>{
  const state=createInitialSurvivorsState('lim_junho',undefined,'stage_12');state.phase='victory';
  const record=operationHandoff(state)!;expect(operationStoryResult(record,state.stage)?.fulfilled).toBe(false);
  const markup=renderToStaticMarkup(<SurvivorsOperationStoryResult record={record} stage={state.stage}/>);
  expect(markup).toContain('다음에 확인할 일');expect(markup).not.toContain('제동 기록이 남았습니다');
  expect(operationStoryResult(record,PATROL_STAGES.stage_13)).toBeNull();
  expect(operationStoryResult({...record,cartStops:-1},state.stage)).toBeNull();
 });
 it('uses only the selected actor history and preserves old-stage identity',()=>{
  const a=createInitialSurvivorsState('player',undefined,'stage_12');a.phase='victory';
  const b=createInitialSurvivorsState('lim_junho',undefined,'stage_13');b.phase='defeat';
  const records=[operationHandoff(a)!,operationHandoff(b)!],before=JSON.stringify(records);
  expect(operationStoryMemory(records,'player',a.stage)).toMatchObject({revisit:true,retry:false});
  expect(operationStoryMemory(records,'lim_junho',a.stage)).toMatchObject({revisit:false,retry:true,record:{stageId:'stage_13'}});
  expect(operationStoryMemory(records,'kang_taesik',a.stage)).toBeNull();expect(JSON.stringify(records)).toBe(before);
 });
 it('shows pilot radio only during the actual safe supply pause and reflects partial progress',()=>{
  const state=createInitialSurvivorsState('kang_taesik',undefined,'stage_12');
  expect(operationStoryIntermission(state,1)).toBeNull();state.phase='playing';expect(operationStoryIntermission(state,1)).toBeNull();
  state.phase='paused';state.terrainRecord!.rubbleCleared=1;
  expect(operationStoryIntermission(state,2)).toMatchObject({wave:2,role:'kang_taesik',facts:{route:1,stop:0,zone:0}});
  expect(operationStoryIntermission(state,3)).toBeNull();state.stageId='stage_13';expect(operationStoryIntermission(state,1)).toBeNull();
 });
 it('warns before a capped supply purchase without pretending a partner grants a new effect',()=>{
  vi.spyOn(Math,'random').mockReturnValue(.5);
  const state=createInitialSurvivorsState('player',undefined,'stage_12');state.phase='paused';state.psiCredits=3000;state.player.dashMaxCooldown=1.8;
  const before=JSON.stringify(state),markup=renderToStaticMarkup(<SurvivorsContainerShop completedWave={1} gameState={state} onContinue={()=>{}}/>);
  expect(markup).toContain('현재 상태에서는 수치 변화가 없습니다');expect(markup).toContain('정비 중 무전');
  expect(markup).toContain('아직 미보유');expect(markup).toContain('별도의 세트 보너스');expect(JSON.stringify(state)).toBe(before);
 });
});
