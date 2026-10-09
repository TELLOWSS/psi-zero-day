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
  it('continues the last actually completed ST12 handoff into ST13 without inventing safety',()=>{
    const recorded={...completed,zones:2,cartStops:3,rubbleCleared:0};
    const next=storyBrief('stage_13','kang_taesik',[recorded]);
    expect(next?.title).toContain('야간 타설');
    expect(next?.evidence).toContain('임준호');
    expect(next?.evidence).toContain('잔재물 정리 0');
    expect(next?.characterLine).toContain('강태식');
    expect(next?.opening).toContain('오늘의');
    expect(storyBrief('stage_13','kang_taesik',[{...recorded,outcome:'defeat'}])).toBeNull();
    expect(storyBrief('stage_14','kang_taesik',[recorded])).toBeNull();
  });
  it('uses the most recent ST12 actual victory and never attributes it to the wrong actor',()=>{
    const earlier={...completed,characterId:'player' as const,zones:1,cartStops:0,rubbleCleared:1};
    const latest={...completed,characterId:'yoon_sungho' as const,zones:4,cartStops:2,rubbleCleared:0};
    const briefing=storyBrief('stage_13','safety_monitor',[earlier,latest])!;
    expect(briefing.evidence).toContain('윤성호');
    expect(briefing.evidence).toContain('통제 구역 4');
    expect(briefing.evidence).not.toContain('안전관리자');
  });

});
