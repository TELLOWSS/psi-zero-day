// @vitest-environment jsdom
import { afterEach,expect,it,vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { SurvivorsAccountabilityEvent } from '../src/ui/SurvivorsAccountabilityEvent';
import { ACCOUNTABILITY_CASES } from '../src/app/survivors-accountability';
import { emptyAccountability } from '../src/domain/survivors-accountability';
afterEach(()=>{document.body.replaceChildren();vi.unstubAllGlobals();});
it('gates confirmation on all evidence and exposes the actual recorded consequence',async()=>{
 vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),decide=vi.fn(()=> '인계할 결과'),proceed=vi.fn();
 await act(async()=>root.render(<SurvivorsAccountabilityEvent incident={ACCOUNTABILITY_CASES[0]!} state={emptyAccountability()} portraitUri="/test-only.png" onDecide={decide} onContinue={proceed} onLeave={()=>{}} onEvidence={()=>{}}/>));
 const confirm=host.querySelector<HTMLButtonElement>('.survivors-btn-primary')!;expect(confirm.disabled).toBe(true);
 const facts=host.querySelectorAll<HTMLButtonElement>('.accountability-facts button');
 for(const button of facts)await act(async()=>button.click());
 expect(confirm.disabled).toBe(false);await act(async()=>confirm.click());
 expect(decide).toHaveBeenCalledWith('confirm',[true,true,true]);expect(host.querySelector('[role="status"]')?.textContent).toBe('인계할 결과');
 await act(async()=>host.querySelector<HTMLButtonElement>('.survivors-btn-primary')!.click());expect(proceed).toHaveBeenCalledOnce();
 await act(async()=>root.unmount());
});
