// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {GuardSpatialControls} from '../src/ui/GuardSpatialControls';
import {guardContents} from '../src/content/guard-campaign';
import {createDefenseRun,applyDefenseCommand} from '../src/engine/defense';
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
function render(node:React.ReactNode){act(()=>root.render(node));}
function click(name:string){const button=[...host.querySelectorAll('button')].find(b=>b.textContent===name)!;act(()=>button.click());}
it('resumes a selected paused tower before applying directional support',()=>{
 const content=guardContents[4]!;
 const built=applyDefenseCommand(createDefenseRun(content,'SIGNALER','ui'),content,{type:'Build',padId:'P1',towerId:'PULSE'});
 const state={...built,status:'RUNNING' as const,paused:true},onCommand=vi.fn();
 render(<GuardSpatialControls content={content} state={state} selectedTower={state.towers[0]!} onCommand={onCommand}/>);
 click('선택 방향 지원');
 expect(onCommand.mock.calls.map(c=>c[0].type)).toEqual(['SetPaused','UseSupport']);
 expect(onCommand.mock.calls[1]![0]).toMatchObject({towerInstanceId:'tower-1',direction:{x:240,y:70}});
});
it('offers transition confirmation and an empty destination for a one-use relocation',()=>{
 const content=guardContents[5]!;
 const built=applyDefenseCommand(createDefenseRun(content,'OBSERVER','ui'),content,{type:'Build',padId:'P1',towerId:'PULSE'});
 const state={...built,status:'INTERMISSION' as const,waveId:5,redeploymentCredits:1},onCommand=vi.fn();
 render(<GuardSpatialControls content={content} state={state} selectedTower={state.towers[0]!} onCommand={onCommand}/>);
 click('통로 전환 확인');
 expect(onCommand).toHaveBeenCalledWith({type:'ConfirmTransition'});
 click('선택 장비 이동');
 expect(onCommand).toHaveBeenCalledWith({type:'RelocateTower',towerInstanceId:'tower-1',padId:'P2'});
});
