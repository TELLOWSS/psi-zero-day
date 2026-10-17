// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it} from 'vitest';
import {Episode02Cinema,ep02Options} from '../src/ui/Episode02Cinema';
import {episode02OpeningEvents} from '../src/content/episode02';

Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
let element:HTMLDivElement,root:ReturnType<typeof createRoot>;
beforeEach(()=>{
  localStorage.clear();
  element=document.createElement('div');document.body.append(element);root=createRoot(element);
});
afterEach(()=>{act(()=>root.unmount());element.remove()});
function button(selector:string){const b=element.querySelector<HTMLButtonElement>(selector);expect(b).not.toBeNull();return b!}
function press(selector:string){act(()=>button(selector).click())}
const noCarryover={} as Parameters<typeof Episode02Cinema>[0]['carryover'];

it('plays and resumes two authored Episode 02 events without changing the Episode 01 save',()=>{
  localStorage.setItem('psi-zero-day.episode.save.v1','ep01-preserved');
  act(()=>root.render(<Episode02Cinema carryover={noCarryover} onExit={()=>{}}/>));
  expect(element.querySelector('[data-episode02-stage]')?.getAttribute('data-episode02-stage')).toBe('0');
  for(let i=0;i<4;i++)press('.ep02-cinema-next');
  expect(element.querySelectorAll('.ep02-cinema-choices button').length).toBe(3);
  press('.ep02-cinema-choices button:nth-child(2)');
  expect(element.textContent).toContain('B동선');
  press('.ep02-cinema-next');
  press('.ep02-cinema-next');
  expect(element.querySelector('[data-episode02-stage]')?.getAttribute('data-episode02-stage')).toBe('1');
  expect(element.querySelectorAll('.ep02-cinema-choices button').length).toBe(1);
  expect(localStorage.getItem('psi-zero-day.episode.save.v1')).toBe('ep01-preserved');
  act(()=>root.unmount());
  root=createRoot(element);
  act(()=>root.render(<Episode02Cinema carryover={noCarryover} onExit={()=>{}}/>));
  expect(element.querySelector('[data-episode02-stage]')?.getAttribute('data-episode02-stage')).toBe('1');
  press('.ep02-cinema-choices button');
  press('.ep02-cinema-next');
  press('.ep02-cinema-next');
  expect(element.textContent).toContain('오프닝 플레이 구간 완료');
});

it('only unlocks a matching delayed consequence choice',()=>{
  const event=episode02OpeningEvents[1] as unknown as Parameters<typeof ep02Options>[0];
  const node=event.dialogue.find(n=>n.node_id==='resolve')!;
  expect(ep02Options(event,node,{day02_lift_action:'plan_route'}).map(x=>x.choice_id)).toEqual(['day02_return_plan_friction']);
  expect(ep02Options(event,node,{day02_lift_action:'field_route'}).map(x=>x.choice_id)).toEqual(['day02_return_experience_dependency']);
  expect(ep02Options(event,node,{day02_lift_action:'shared_route'}).map(x=>x.choice_id)).toEqual(['day02_return_shared_route']);
});
