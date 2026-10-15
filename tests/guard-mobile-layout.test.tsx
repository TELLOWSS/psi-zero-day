// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {DefenseTechTree} from '../src/ui/DefenseTechTree';
import {GuardMobileInfo} from '../src/ui/GuardMobileInfo';
import {guardContents} from '../src/content/guard-campaign';
import {applyDefenseCommand,createDefenseRun} from '../src/engine/defense';
let host:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{(globalThis as typeof globalThis&{IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
const content=guardContents[0]!;
const built=()=>applyDefenseCommand(createDefenseRun(content,'COORDINATOR','mobile-tree'),content,{type:'Build',towerId:'PULSE',padId:'P1'});
function renderTree(run= built()){
 const onCommand=vi.fn();act(()=>root.render(<DefenseTechTree compact content={content} tower={run.towers[0]!} resource={run.resource} advice={null} onCommand={onCommand}/>));return onCommand;
}
it('prioritizes the immediate upgrade and requires confirmation before spending',()=>{
 const onCommand=renderTree(),before=JSON.stringify(built());
 expect([...host.querySelectorAll('[data-level]')].map(x=>x.getAttribute('data-level'))).toEqual(['L2']);
 act(()=>(host.querySelector('[data-level="L2"]') as HTMLButtonElement).click());
 expect(onCommand).not.toHaveBeenCalled();
 act(()=>(host.querySelector('.guard-evolution-confirm') as HTMLButtonElement).click());
 expect(onCommand).toHaveBeenCalledWith({type:'Upgrade',towerInstanceId:'tower-1',levelId:'L2'});
 expect(JSON.stringify(built())).toBe(before);
});
it('exposes the complete tree on demand while preserving ultimate restrictions',()=>{
 const onCommand=renderTree();
 act(()=>(host.querySelector('.guard-tree-toggle') as HTMLButtonElement).click());
 expect(host.querySelectorAll('[data-level]')).toHaveLength(6);
 act(()=>(host.querySelector('[data-level="L4A"]') as HTMLButtonElement).click());
 expect((host.querySelector('.guard-evolution-confirm') as HTMLButtonElement).disabled).toBe(true);
 expect(onCommand).not.toHaveBeenCalled();
});
it('shows both immediate branches after L2',()=>{
 const first=built(),run=applyDefenseCommand(first,content,{type:'Upgrade',towerInstanceId:'tower-1',levelId:'L2'});
 renderTree(run);
 expect([...host.querySelectorAll('[data-level]')].map(x=>x.getAttribute('data-level'))).toEqual(['L3A','L3B']);
});
it('focuses the information close button, supports Escape, and restores the trigger',()=>{
 const trigger=document.createElement('button');document.body.append(trigger);trigger.focus();
 const onClose=vi.fn();
 act(()=>root.render(<GuardMobileInfo onClose={onClose}><p>파 정보</p></GuardMobileInfo>));
 expect(document.activeElement).toBe(host.querySelector('button'));
 act(()=>host.querySelector('section')!.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 expect(onClose).toHaveBeenCalledOnce();
 act(()=>root.render(null));expect(document.activeElement).toBe(trigger);trigger.remove();
});
