// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {SurvivorsNarrativeDirection} from '../src/ui/SurvivorsNarrativeDirection';
import {HANDOFF_DIALOGUE_KEY} from '../src/app/handoff-dialogue-store';
import {HANDOFF_DIALOGUE_EVENT} from '../src/domain/survivors-handoff-dialogue';
import {NARRATIVE_DIRECTION_KEY} from '../src/app/narrative-direction-store';
import type {OperationHandoff} from '../src/domain/survivors-operation-handoff';
const record:OperationHandoff={version:1,characterId:'player',stageId:'stage_12',stageNumber:12,outcome:'victory',zones:1,cartStops:1,rubbleCleared:1,damageTaken:0,stars:[true,true,true]};
let root:Root,host:HTMLDivElement;
beforeEach(()=>{localStorage.clear();localStorage.setItem(HANDOFF_DIALOGUE_KEY,JSON.stringify({version:1,eventId:HANDOFF_DIALOGUE_EVENT,choice:'together'}));host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{vi.restoreAllMocks();await act(async()=>root.unmount());host.remove();localStorage.clear();});
async function click(label:string){const button=[...host.querySelectorAll('button')].find(node=>node.textContent?.trim()===label);expect(button).toBeDefined();await act(async()=>button!.click());}
async function select(value:string){await act(async()=>{const node=host.querySelector('select')!;node.value=value;node.dispatchEvent(new Event('change',{bubbles:true}));});}
describe('narrative interest optional UI',()=>{
 for(const [label,invalid] of [['no route',{...record,rubbleCleared:0}],['other actor',{...record,characterId:'lim_junho'}],['other stage',{...record,stageId:'stage_13',stageNumber:13}]] as const)it(`does not show saved art for ${label}`,async()=>{
  localStorage.setItem(NARRATIVE_DIRECTION_KEY,JSON.stringify({version:1,characterId:'player',direction:'control'}));
  await act(async()=>root.render(<SurvivorsNarrativeDirection record={invalid}/>));expect(host.textContent).toBe('');expect(host.querySelector('img')).toBeNull();
 });
 it('does not treat a corrupt saved dialogue as approval evidence',async()=>{
  localStorage.setItem(HANDOFF_DIALOGUE_KEY,'{');localStorage.setItem(NARRATIVE_DIRECTION_KEY,JSON.stringify({version:1,characterId:'player',direction:'control'}));
  await act(async()=>root.render(<SurvivorsNarrativeDirection record={record}/>));expect(host.textContent).toBe('');
 });
 it('hides without approved dialogue and observed completion',async()=>{
  localStorage.removeItem(HANDOFF_DIALOGUE_KEY);await act(async()=>root.render(<SurvivorsNarrativeDirection record={record}/>));expect(host.textContent).toBe('');
  localStorage.setItem(HANDOFF_DIALOGUE_KEY,JSON.stringify({version:1,eventId:HANDOFF_DIALOGUE_EVENT,choice:'together'}));
  await act(async()=>root.render(<SurvivorsNarrativeDirection record={{...record,outcome:'defeat'}}/>));expect(host.textContent).toBe('');
 });
 it('focuses the selector and restores focus without saving a draft',async()=>{
  await act(async()=>root.render(<SurvivorsNarrativeDirection record={record}/>));await click('관심사 선택');expect(document.activeElement).toBe(host.querySelector('select'));
  await select('investigation');await click('나중에');expect(localStorage.getItem(NARRATIVE_DIRECTION_KEY)).toBeNull();expect(document.activeElement?.textContent).toBe('관심사 선택');
 });
 it('retains the saved interest on failure and retries the explicit change',async()=>{
  localStorage.setItem(NARRATIVE_DIRECTION_KEY,JSON.stringify({version:1,characterId:'player',direction:'control'}));await act(async()=>root.render(<SurvivorsNarrativeDirection record={record}/>));
  await click('관심사 변경');await select('coordination');const before=localStorage.getItem(NARRATIVE_DIRECTION_KEY);
  expect(host.querySelector('.survivors-narrative-interest-scene img')).not.toBeNull();
  const failure=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('quota');});await click('관심사 저장');expect(host.querySelector('[role=alert]')).not.toBeNull();expect(localStorage.getItem(NARRATIVE_DIRECTION_KEY)).toBe(before);
  expect(host.querySelector('.survivors-narrative-interest-scene img')).not.toBeNull();
  failure.mockRestore();await click('관심사 저장');expect(JSON.parse(localStorage.getItem(NARRATIVE_DIRECTION_KEY)!).direction).toBe('coordination');expect(host.querySelector('[role=status]')).not.toBeNull();
  expect(host.querySelector('.survivors-narrative-interest-scene img')).toBeNull();
  const writes=vi.spyOn(Storage.prototype,'setItem');await click('관심사 저장');expect(writes).not.toHaveBeenCalled();await click('나중에');expect(document.activeElement?.textContent).toBe('관심사 변경');
 });
});
