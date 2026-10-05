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
    expect(host.querySelector('#store-panel-fitting')?.hasAttribute('hidden')).toBe(true);
    const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    act(() => tabs[0]!.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight', bubbles:true})));
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    act(() => tabs[0]!.click());
    const select=host.querySelector<HTMLSelectElement>('#store-panel-browse select')!;
    act(()=>{select.value='communication';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(host.querySelectorAll('article')).toHaveLength(3);
    const array=[...host.querySelectorAll('article')].find(card=>card.textContent?.includes('PSI 지휘 어레이'))!;
    expect(array.textContent).toContain('교체 대상: 지향성 계도 렌즈');
    act(()=>array.querySelector('button')!.click());expect(change).toHaveBeenCalledWith('command_array',false);
    const crown=[...host.querySelectorAll('article')].find(card=>card.textContent?.includes('광역 교육 크라운'))!;
    expect(crown.querySelector('button')!.disabled).toBe(true);
    act(()=>host.querySelectorAll<HTMLInputElement>('#store-panel-browse input')[0]!.click());
    expect(host.querySelectorAll('article')).toHaveLength(2);
  }finally{act(()=>root.unmount());}
});
it('previews six slots together, quotes one purchase and blocks broken gear until repaired',()=>{
 const host=document.createElement('div'),root=createRoot(host),change=vi.fn(),apply=vi.fn(),repair=vi.fn();
 const inventory={owned:['voice_lens'],equipped:['voice_lens'],durability:{voice_lens:0}};
 try{
  act(()=>root.render(<SurvivorsEquipmentStore inventory={inventory} credits={10000} message="" onChange={change} onApply={apply} onRepair={repair}/>));
  act(()=>host.querySelectorAll<HTMLButtonElement>('[role=tab]')[1]!.click());
  const select=(slot:string,id:string)=>act(()=>{const s=host.querySelector<HTMLSelectElement>(`select[aria-label="${slot}"]`)!;s.value=id;s.dispatchEvent(new Event('change',{bubbles:true}));});
  select('계도 전달','voice_lens');select('생존 지원','rescue_shell');select('동행 지원','inspection_wing');
  const action=host.querySelector<HTMLButtonElement>('.survivors-fitting-action button')!;
  expect(action.textContent).toContain('4,500 PSI');expect(action.disabled).toBe(true);
  expect(host.querySelector('.survivors-fitting-action')?.textContent).toContain('3/6');
  const repairButton=host.querySelector<HTMLButtonElement>('.survivors-fitting-slots button')!;
  act(()=>repairButton.click());expect(repair).toHaveBeenCalledWith('voice_lens');
  select('계도 전달','');expect(action.disabled).toBe(false);
  act(()=>action.click());expect(apply).toHaveBeenCalledWith(['rescue_shell','inspection_wing']);
  expect(change).not.toHaveBeenCalled();expect(inventory.owned).toEqual(['voice_lens']);
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
    expect(host.querySelector('#store-panel-fitting')?.hasAttribute('hidden')).toBe(false);
    expect(host.querySelector<HTMLButtonElement>('.survivors-fitting-action button')?.disabled).toBe(true);
    expect(change).not.toHaveBeenCalled();
    expect(inventory).toEqual({ owned: ['voice_lens'], equipped: ['voice_lens'] });
    act(() => host.querySelector<HTMLButtonElement>('.survivors-fitting-summary button')!.click());
    expect(host.querySelector('.survivors-fitting-summary')?.textContent).toContain('현재 장착');
  } finally { act(() => root.unmount()); }
});
it('changes fitting pose and playback without purchasing or changing the loadout',()=>{
 const host=document.createElement('div'),root=createRoot(host),change=vi.fn(),inventory={owned:['voice_lens'],equipped:['voice_lens']};
 try{
  act(()=>root.render(<SurvivorsEquipmentStore inventory={inventory} credits={0} message="" onChange={change}/>));
  const button=(name:string)=>host.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  const select=host.querySelector<HTMLSelectElement>('select[aria-label="미리보기 동작"]')!;
  for(const value of ['walk','shot','spray','ultimate']){
   act(()=>{select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));});
   expect(select.value).toBe(value);
  }
  act(()=>button('미리보기 일시정지').click());expect(button('미리보기 재생').getAttribute('aria-pressed')).toBe('false');
  act(()=>button('왼쪽').click());expect(button('왼쪽').getAttribute('aria-pressed')).toBe('true');
  expect(change).not.toHaveBeenCalled();expect(inventory.equipped).toEqual(['voice_lens']);
 }finally{act(()=>root.unmount());}
});
