// @vitest-environment jsdom
import {act,type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,describe,expect,it} from 'vitest';
import {SurvivorsStoryBeat} from '../src/ui/SurvivorsStoryBeat';
import {OPERATION_HANDOFF_KEY} from '../src/app/operation-handoff-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
afterEach(()=>localStorage.removeItem(OPERATION_HANDOFF_KEY));
const completed:OperationHandoff={version:1,characterId:'lim_junho',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:2,cartStops:4,rubbleCleared:0,damageTaken:1,stars:[true,false,false]};
function render(ui:ReactNode) {
 const host=document.createElement('div');
 document.body.appendChild(host);
 const root=createRoot(host);
 act(()=>root.render(ui));
 return {host,dispose:()=>{act(()=>root.unmount());host.remove();}};
}
describe('ST12 player-facing story readouts',()=>{
 it('does not cover other stages with a story panel',()=>{
   const v=render(<SurvivorsStoryBeat stageId="stage_11" characterId="lim_junho" view="brief"/>);
   try{expect(v.host.querySelector('.survivors-story-beat')).toBeNull();}finally{v.dispose();}
 });
 it('shows actor briefing at preparation, while keeping no overlay during action',()=>{
   const v=render(<SurvivorsStoryBeat stageId="stage_12" characterId="lim_junho" view="brief"/>);
   try{
     expect(v.host.querySelector('[data-story-view="brief"]')).not.toBeNull();
     expect(v.host.textContent).toContain('퇴근 전에, 이 길만은');
     expect(v.host.textContent).toContain('임준호');
   }finally{v.dispose();}
 });
 it('renders exact real counters and never infers route clearance from victory',()=>{
   const v=render(<SurvivorsStoryBeat stageId="stage_12" characterId="lim_junho" view="result" record={completed}/>);
   try{
     expect(v.host.textContent).toContain('돌진 제동 4');
     expect(v.host.textContent).toContain('잔재물 정리 0');
     expect(v.host.textContent).toContain('정리 기록은 없습니다');
     expect(v.host.textContent).not.toContain('잔재물 1건을 정리했습니다');
   }finally{v.dispose();}
 });
 it('shows prior successful different-actor evidence and excludes defeats',()=>{
   localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([completed]));
   const v=render(<SurvivorsStoryBeat stageId="stage_12" characterId="kang_taesik" view="brief"/>);
   try{expect(v.host.textContent).toContain('다른 동료의 같은 현장 기록');expect(v.host.textContent).toContain('제동 4');}finally{v.dispose();}
   localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([{...completed,outcome:'defeat'}]));
   const w=render(<SurvivorsStoryBeat stageId="stage_12" characterId="kang_taesik" view="brief"/>);
   try{expect(w.host.textContent).not.toContain('다른 동료의 같은 현장 기록');}finally{w.dispose();}
 });
 it('shows ST13 next-shift handoff only after a genuine ST12 completion',()=>{
   const v=render(<SurvivorsStoryBeat stageId="stage_13" characterId="kang_taesik" view="brief"/>);
   try{expect(v.host.querySelector('.survivors-story-beat')).toBeNull();}finally{v.dispose();}
   localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([completed]));
   const withHistory=render(<SurvivorsStoryBeat stageId="stage_13" characterId="kang_taesik" view="brief"/>);
   try{
     expect(withHistory.host.textContent).toContain('어제의 인계');
     expect(withHistory.host.textContent).toContain('잔재물 정리 0');
     expect(withHistory.host.textContent).toContain('임준호');
   }finally{withHistory.dispose();}
 });

});

describe('ST14 boss and ST15 next-shift panels',()=>{
 const bossWin:OperationHandoff={...completed,stageId:'stage_14',stageNumber:14,characterId:'kang_taesik',zones:2,damageTaken:5};
 it('shows brief before gangform and exact result only on earned victory',()=>{
  const p=render(<SurvivorsStoryBeat stageId="stage_14" characterId="lim_junho" view="brief"/>);
  try{expect(p.host.textContent).toContain('4.5초');expect(p.host.textContent).toContain('임준호');}finally{p.dispose();}
  const d=render(<SurvivorsStoryBeat stageId="stage_14" characterId="kang_taesik" view="result" record={{...bossWin,outcome:'defeat'}}/>);
  try{expect(d.host.querySelector('.survivors-story-beat')).toBeNull();}finally{d.dispose();}
  const w=render(<SurvivorsStoryBeat stageId="stage_14" characterId="kang_taesik" view="result" record={bossWin}/>);
  try{expect(w.host.textContent).toContain('받은 피해 5');expect(w.host.textContent).toContain('다음 신호');}finally{w.dispose();}
 });
 it('reveals next missing-bay story only with saved boss victory',()=>{
  const noRecord=render(<SurvivorsStoryBeat stageId="stage_15" characterId="lim_junho" view="brief"/>);
  try{expect(noRecord.host.querySelector('.survivors-story-beat')).toBeNull();}finally{noRecord.dispose();}
  localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([bossWin]));
  const earned=render(<SurvivorsStoryBeat stageId="stage_15" characterId="lim_junho" view="brief"/>);
  try{expect(earned.host.textContent).toContain('사라진 한 칸');expect(earned.host.textContent).toContain('강태식');}finally{earned.dispose();}
 });
});

describe('ST25 playable twist and ST26 continuity',()=>{
 const win:OperationHandoff={...completed,stageId:'stage_25',stageNumber:25,outcome:'victory',characterId:'lim_junho',damageTaken:3,zones:2};
 it('renders ST25 briefing without inventing an already won route',()=>{
  const v=render(<SurvivorsStoryBeat stageId="stage_25" characterId="lim_junho" view="brief"/>);
  try{
   expect(v.host.textContent).toContain('어제의 통로');
   expect(v.host.textContent).toContain('3점');
   expect(v.host.textContent).toContain('임준호');
  }finally{v.dispose();}
 });
 it('displays exact ST25 victory and only then shows ST26 old-workface handoff',()=>{
  const finish=render(<SurvivorsStoryBeat stageId="stage_25" characterId="lim_junho" view="result" record={win}/>);
  try{expect(finish.host.textContent).toContain('피해 3');}finally{finish.dispose();}
  const previous=render(<SurvivorsStoryBeat stageId="stage_26" characterId="lee_jaehoon" view="brief"/>);
  try{expect(previous.host.querySelector('.survivors-story-beat')).toBeNull();}finally{previous.dispose();}
  localStorage.setItem(OPERATION_HANDOFF_KEY,JSON.stringify([win]));
  const next=render(<SurvivorsStoryBeat stageId="stage_26" characterId="lee_jaehoon" view="brief"/>);
  try{
   expect(next.host.textContent).toContain('설비 재조사');
   expect(next.host.textContent).toContain('임준호');
   expect(next.host.textContent).toContain('이재훈');
  }finally{next.dispose();}
 });
});
