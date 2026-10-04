// @vitest-environment jsdom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect,vi} from 'vitest';
import {PatrolSurvivorsGame} from '../src/ui/PatrolSurvivorsGame';
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('purchases, equips and restores gear; storage failure never charges the wallet',()=>{
  localStorage.clear();localStorage.setItem('psi.survivors.credits','5000');
  // Use the current credit key even when a prior version named it differently.
  localStorage.setItem('psi.survivors.psi_credits','5000');
  localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:5000,inventory:{owned:[],equipped:[]}}));
  vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
  const host=document.createElement('div');document.body.append(host);let root=createRoot(host);
  const click=(text:string)=>act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!.click());
  try {
    act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} audioMuted />));
    click('R&D');
    click('구매 · 800');
    expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).credits).toBe(4200);
    const card=[...host.querySelectorAll('article')].find(a=>a.textContent?.includes('지향성 계도 렌즈'))!;
    act(()=>card.querySelector('button')!.click());
    expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).inventory.equipped).toEqual(['voice_lens']);
    const fail=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full');});
    click('구매 · 2,400');
    expect(host.querySelector('[role=alert]')?.textContent).toContain('차감되지');
    expect(JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!).credits).toBe(4200);
    fail.mockRestore();
    act(()=>root.unmount());root=createRoot(host);
    act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} audioMuted />));
    expect(host.textContent).toContain('지향성 계도 렌즈');
    expect(host.textContent).toContain('4,200');
  } finally {act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();}
});

it('shows an owned useful item before patrol and equips it without a purchase',()=>{
  localStorage.clear();localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:300,inventory:{owned:['inspection_wing'],equipped:[]}}));
  vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  try {
    act(()=>root.render(<PatrolSurvivorsGame onExit={()=>{}} audioMuted />));
    const hint=host.querySelector('.survivors-preflight-gear')!;
    expect(hint.textContent).toContain('PSI 감시 윙');
    expect(hint.textContent).toContain('보유 장비');
    act(()=>hint.querySelector('button')!.click());
    const wallet=JSON.parse(localStorage.getItem('psi.survivors.store_wallet')!);
    expect(wallet.credits).toBe(300);expect(wallet.inventory.equipped).toEqual(['inspection_wing']);
    expect(host.querySelector('.survivors-store-loadout')?.textContent).toContain('PSI 감시 윙');
  } finally {act(()=>root.unmount());host.remove();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();}
});
