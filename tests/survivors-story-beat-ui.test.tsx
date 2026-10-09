// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,describe,expect,it} from 'vitest';
import {SurvivorsStoryBeat} from '../src/ui/SurvivorsStoryBeat';
import {OPERATION_HANDOFF_KEY} from '../src/app/operation-handoff-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
afterEach(()=>localStorage.removeItem(OPERATION_HANDOFF_KEY));
const completed:OperationHandoff={version:1,characterId:'lim_junho',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:2,cartStops:4,rubbleCleared:0,damageTaken:1,stars:[true,false,false]};
function render(ui:React.ReactNode) {
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
});
