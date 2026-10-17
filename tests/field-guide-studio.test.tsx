// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect} from 'vitest';
import {FieldGuide} from '../src/ui/FieldGuide';
import {EpisodeSession} from '../src/app/episode-session';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('searches across processes by FG code, handles no matches, and preserves observation details',()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try{
  act(()=>root.render(<FieldGuide session={new EpisodeSession()}/>));
  const input=host.querySelector<HTMLInputElement>('input[type=search]')!;
  const search=(value:string)=>act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
  search('fg107');expect(host.querySelectorAll('.field-guide-list button')).toHaveLength(1);expect(host.querySelector('.field-guide-detail [data-item-key]')?.getAttribute('data-item-key')).toBe('material_stack');
  expect(host.querySelector('.field-guide-detail')?.textContent).not.toContain('+15%');
  search('zzzz-no-match');expect(host.querySelector('.field-guide-empty')?.textContent).toContain('검색 결과가 없습니다');expect(host.querySelector('.field-guide-detail')).toBeNull();
  search('');expect(host.querySelectorAll('.field-guide-list button')).toHaveLength(118);
 }finally{act(()=>root.unmount());host.remove();}
});
