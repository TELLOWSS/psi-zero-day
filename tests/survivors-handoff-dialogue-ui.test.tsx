// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {SurvivorsHandoffDialogue} from '../src/ui/SurvivorsHandoffDialogue';
import {HANDOFF_DIALOGUE_KEY} from '../src/app/handoff-dialogue-store';
let root:Root,host:HTMLDivElement;
beforeEach(()=>{localStorage.clear();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();localStorage.clear();});
async function click(label:string){const button=[...host.querySelectorAll('button')].find(node=>node.textContent?.trim()===label);expect(button).toBeDefined();await act(async()=>button!.click());}
describe('handoff dialogue focus and optional flow',()=>{
 it('does not take focus on mount and returns focus after skipping without storing',async()=>{
  const outside=document.createElement('button');document.body.append(outside);outside.focus();
  await act(async()=>root.render(<SurvivorsHandoffDialogue/>));expect(document.activeElement).toBe(outside);
  await click('인계 대화');await click('나중에');
  expect(document.activeElement?.textContent?.trim()).toBe('인계 대화');
  expect(localStorage.getItem(HANDOFF_DIALOGUE_KEY)).toBeNull();outside.remove();
 });
 for(const [label,choice] of [['경계부터 함께 확인해요','together'],['확인한 내용부터 설명할게요','explain']] as const)it(`returns focus after ${choice} without changing its replay record`,async()=>{
  await act(async()=>root.render(<SurvivorsHandoffDialogue/>));await click('인계 대화');await click(label);
  expect(document.activeElement).toBe(host.querySelector('.survivors-handoff-line'));
  const before=localStorage.getItem(HANDOFF_DIALOGUE_KEY);await click('닫기');
  expect(document.activeElement?.textContent?.trim()).toBe('다시보기');await click('다시보기');
  expect(document.activeElement).toBe(host.querySelector('.survivors-handoff-line'));
  expect(localStorage.getItem(HANDOFF_DIALOGUE_KEY)).toBe(before);
 });
});
