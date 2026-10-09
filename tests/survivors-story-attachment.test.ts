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
    expect(storyOutcome({...completed,stageId:'stage_11',stageNumber:11})).toBeNull();
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
    expect(storyBrief('stage_14','kang_taesik',[recorded])?.alternateView).toBeUndefined();
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

describe('ST14 gangform and ST15 earned continuity',()=>{
 const cleared:OperationHandoff={...completed,stageId:'stage_14',stageNumber:14,characterId:'kang_taesik',zones:3,cartStops:0,rubbleCleared:0,damageTaken:7};
 it('uses the live gameplay contract of TWO drop zones and the 4.5 second burst window',()=>{
  const brief=storyBrief('stage_14','lim_junho');
  expect(brief?.opening).toContain('두 곳');
  expect(brief?.opening).toContain('4.5초');
  expect(brief?.characterLine).toContain('임준호');
  expect(brief?.alternateView).toBeUndefined();
 });
 it('remembers a completed ST13 shift but never invents one on failure',()=>{
  const prior:OperationHandoff={...completed,stageId:'stage_13',stageNumber:13,zones:5,damageTaken:9};
  const brief=storyBrief('stage_14','kang_taesik',[prior]);
  expect(brief?.alternateView).toContain('임준호');
  expect(brief?.alternateView).toContain('통제 구역 5');
  expect(brief?.alternateView).toContain('피해 9');
  expect(storyBrief('stage_14','kang_taesik',[{...prior,outcome:'defeat'}])?.alternateView).toBeUndefined();
 });
 it('uses exact ST14 victory counters without claiming the two zones were necessarily controlled',()=>{
  const result=storyOutcome(cleared);
  expect(result?.title).toContain('공중의 위험');
  expect(result?.evidence).toContain('통제 구역 3');
  expect(result?.evidence).toContain('받은 피해 7');
  expect(result?.evidence).toContain('잔재 정리 0');
  expect(result?.opening).toContain('자동 보증');
  expect(storyOutcome({...cleared,outcome:'defeat'})).toBeNull();
 });
 it('keeps a distinct line for all six cast members on both sides of the boss',()=>{
  const cast:CharacterId[]=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
  expect(new Set(cast.map(id=>storyBrief('stage_14',id)?.characterLine)).size).toBe(6);
  expect(new Set(cast.map(id=>storyOutcome({...cleared,characterId:id})?.characterLine)).size).toBe(6);
 });
 it('only opens ST15 memory from actual ST14 victory, and skips unrelated stages',()=>{
  expect(storyBrief('stage_15','lim_junho')).toBeNull();
  expect(storyBrief('stage_15','lim_junho',[{...cleared,outcome:'defeat'}])).toBeNull();
  const next=storyBrief('stage_15','lim_junho',[cleared]);
  expect(next?.evidence).toContain('강태식');
  expect(next?.evidence).toContain('받은 피해 7');
  expect(next?.characterLine).toContain('임준호');
  expect(storyBrief('stage_16','lim_junho',[cleared])).toBeNull();
 });
 it('shows only another actor actual cleared ST14, never a defeat or same actor',()=>{
  const thisActor={...cleared,characterId:'lim_junho' as const};
  expect(storyOutcome(thisActor,[cleared])?.alternateView).toContain('받은 피해 7');
  expect(storyOutcome(thisActor,[{...cleared,outcome:'defeat'}])?.alternateView).toBeUndefined();
  expect(storyOutcome(thisActor,[thisActor])?.alternateView).toBeUndefined();
 });
});
