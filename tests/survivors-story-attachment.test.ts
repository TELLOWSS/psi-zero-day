import {describe,expect,it} from 'vitest';
import {storyBrief,storyOutcome} from '../src/domain/survivors-story-attachment';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
import type {CharacterId} from '../src/domain/patrol-survivors';

const completed:OperationHandoff={
  version:1,characterId:'lim_junho',stageId:'stage_12',stageNumber:12,
  outcome:'victory',zones:2,cartStops:3,rubbleCleared:1,
  damageTaken:2,stars:[true,true,false],
};
describe('Stage 12 story attachment — actual evidence only',()=>{
  it('is scoped to the existing rebar stage and never changes non-story stages',()=>{
    expect(storyBrief('stage_11','lim_junho')).toBeNull();
    expect(storyBrief('stage_13','lim_junho')).toBeNull();
    expect(storyOutcome({...completed,stageId:'stage_14',stageNumber:14})).toBeNull();
  });
  it('reads real final counters rather than claiming unearned corridor clearance',()=>{
    const result=storyOutcome(completed)!;
    expect(result.evidence).toContain('통제 구역 2');
    expect(result.evidence).toContain('돌진 제동 3');
    expect(result.evidence).toContain('잔재물 정리 1');
    expect(result.opening).toContain('잔재물 1건');
    const noClear=storyOutcome({...completed,zones:0,cartStops:0,rubbleCleared:0})!;
    expect(noClear.opening).toContain('정리 기록은 없습니다');
    expect(noClear.evidence).toContain('잔재물 정리 0');
    expect(noClear.opening).not.toContain('정리했습니다');
  });
  it('never describes a defeated operation as a victory',()=>{
    expect(storyOutcome({...completed,outcome:'defeat'})).toBeNull();
    expect(storyOutcome(null)).toBeNull();
  });
  it('has distinct brief and response lines for all six canonical characters',()=>{
    const roles:CharacterId[]=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
    const briefs=roles.map(id=>storyBrief('stage_12',id)!.characterLine);
    const results=roles.map(id=>storyOutcome({...completed,characterId:id})!.characterLine);
    expect(new Set(briefs).size).toBe(6);
    expect(new Set(results).size).toBe(6);
    expect(storyBrief('stage_12','park')?.characterLine).toBe(briefs[1]);
    expect(storyBrief('stage_12','yoon')?.characterLine).toBe(briefs[0]);
  });
  it('reveals only an actual victorious alternate actor report',()=>{
    const other=storyBrief('stage_12','kang_taesik',[completed]);
    expect(other?.alternateView).toContain('제동 3');
    expect(other?.alternateView).toContain('정리 1');
    expect(storyBrief('stage_12','lim_junho',[completed])?.alternateView).toBeUndefined();
    expect(storyBrief('stage_12','kang_taesik',[{...completed,outcome:'defeat'}])?.alternateView).toBeUndefined();
    const result=storyOutcome({...completed,characterId:'kang_taesik'},[completed])!;
    expect(result.alternateView).toContain('통제 구역 2');
  });
});
