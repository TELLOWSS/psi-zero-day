// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {SurvivorsEquipmentStore} from '../src/ui/SurvivorsEquipmentStore';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
vi.mock('../src/ui/SurvivorsFittingPreview', () => ({ SurvivorsFittingPreview: () => <div/> }));
it('filters gear, shows the replacement slot and never offers an unaffordable purchase',()=>{
  const host=document.createElement('div'),root=createRoot(host),change=vi.fn();
  try{
    act(()=>root.render(<SurvivorsEquipmentStore inventory={{owned:['voice_lens','command_array'],equipped:['voice_lens']}} credits={500} message="" onChange={change}/>));
    expect(host.querySelectorAll('article')).toHaveLength(16);
    const select=host.querySelector('select')!;
    act(()=>{select.value='communication';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelectorAll('article')).toHaveLength(3);
    const array=[...host.querySelectorAll('article')].find(card=>card.textContent?.includes('PSI 지휘 어레이'))!;
    expect(array.textContent).toContain('교체 대상: 지향성 계도 렌즈');
    act(()=>array.querySelector('button')!.click());expect(change).toHaveBeenCalledWith('command_array',false);
    const crown=[...host.querySelectorAll('article')].find(card=>card.textContent?.includes('광역 교육 크라운'))!;
    expect(crown.querySelector('button')!.disabled).toBe(true);
    act(()=>host.querySelectorAll<HTMLInputElement>('input')[0]!.click());
    expect(host.querySelectorAll('article')).toHaveLength(2);
  }finally{act(()=>root.unmount());}
});

it('trying an unaffordable item changes only the fitting view', () => {
  const host = document.createElement('div'), root = createRoot(host), change = vi.fn();
  const inventory = { owned: ['voice_lens'], equipped: ['voice_lens'] };
  try {
    act(() => root.render(<SurvivorsEquipmentStore inventory={inventory} credits={0} message="" onChange={change}/>));
    const crown = [...host.querySelectorAll('article')].find(card => card.textContent?.includes('광역 교육 크라운'))!;
    act(() => [...crown.querySelectorAll('button')].find(button => button.textContent === '착용해 보기')!.click());
    expect(host.querySelector('.survivors-fitting-summary')?.textContent).toContain('광역 교육 크라운');
    expect(change).not.toHaveBeenCalled();
    expect(inventory).toEqual({ owned: ['voice_lens'], equipped: ['voice_lens'] });
    act(() => host.querySelector<HTMLButtonElement>('.survivors-fitting-summary button')!.click());
    expect(host.querySelector('.survivors-fitting-summary')?.textContent).toContain('현재 장착');
  } finally { act(() => root.unmount()); }
});
