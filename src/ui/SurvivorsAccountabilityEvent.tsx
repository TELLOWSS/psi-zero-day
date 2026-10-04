import { useEffect, useRef, useState } from 'react';
import text from '../../content/localization/survivors-accountability-ko.json';
import type { ACCOUNTABILITY_CASES } from '../app/survivors-accountability';
import type { AccountabilityAction, AccountabilityState } from '../domain/survivors-accountability';

export function SurvivorsAccountabilityEvent({incident,state,portraitUri,onDecide,onContinue,onLeave,onEvidence}: {
  incident:typeof ACCOUNTABILITY_CASES[number];state:AccountabilityState;portraitUri:string;
  onDecide:(action:AccountabilityAction,evidence:readonly boolean[])=>string;
  onContinue:()=>void;onLeave:()=>void;onEvidence:()=>void;
}) {
  const [seen,setSeen]=useState([false,false,false]);const [result,setResult]=useState('');
  const dialog=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const overlay=dialog.current?.parentElement;
    const siblings=Array.from(overlay?.parentElement?.children||[]).filter(e=>e!==overlay&&e instanceof HTMLElement) as HTMLElement[];
    const original=siblings.map(e=>e.inert);siblings.forEach(e=>{e.inert=true;});
    dialog.current?.focus();return()=>{siblings.forEach((e,i)=>{e.inert=original[i]||false;});previous?.focus();};
  },[]);
  return <div className="survivors-accountability-backdrop">
    <div ref={dialog} className="survivors-accountability-event" role="dialog" aria-modal="true" aria-labelledby="accountability-title" tabIndex={-1} onKeyDown={event=>{
      if(event.key==='Escape'){event.preventDefault();result?onContinue():onLeave();}
      if(event.key==='Tab'){
        const buttons=dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
        const first=buttons?.[0],last=buttons?.[buttons.length-1];
        if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===dialog.current)){event.preventDefault();first?.focus();}
      }
    }}>
      <header><small>{text.title}</small><h2 id="accountability-title">{incident.title}</h2><span>{text.worker}</span></header>
      <div className="accountability-dialogue-row"><img src={portraitUri} alt={text.foreman}/><p className="accountability-dialogue">{incident.line}</p></div>
      <p className="accountability-policy">{text.policy}</p>
      <p className="accountability-record">{text.warning}: {state.warnings}/3 · {state.access==='held'?text.held:state.access==='excluded'?text.excluded:text.evidenceHint}</p>
      {!result ? <>
        <div className="accountability-facts">{incident.facts.map((fact,i)=><section key={fact}>
          <button type="button" aria-expanded={seen[i]} onClick={()=>{if(!seen[i]){setSeen(previous=>previous.map((value,index)=>index===i?true:value));onEvidence();}}}>{text.checkLabels[i]}{seen[i]?' ✓':''}</button>
          {seen[i]&&<p>{fact}</p>}
        </section>)}</div>
        <div className="accountability-actions">
          <button type="button" className="survivors-btn-primary" data-accountability-confirm disabled={!seen.every(Boolean)} onClick={()=>setResult(onDecide('confirm',seen))}>{text.confirmLabels[incident.kind==='equipment'?0:Math.min(3,state.warnings+1)]}</button>
          <button type="button" className="survivors-btn-secondary" onClick={()=>setResult(onDecide('hold',seen))}>{text.hold}</button>
          <button type="button" className="survivors-btn-secondary" onClick={onLeave}>{text.close}</button>
        </div>
      </> : <><p className="accountability-result" role="status">{result}</p><button type="button" className="survivors-btn-primary" onClick={onContinue}>{text.continue}</button></>}
    </div>
  </div>;
}
