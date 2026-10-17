import {useEffect,useRef} from 'react';
import text from '../../content/localization/survivors-ultimate-ko.json';
import {ultimateReadiness} from './survivors-ultimate-learning';

export function SurvivorsUltimateBrief(){return <section className="survivors-ultimate-brief" aria-label={text.briefTitle}>
 <strong>{text.briefTitle}</strong><p>{text.briefBody}</p><small>{text.separateControls}</small>
</section>;}
export function SurvivorsUltimateControl({charge,max,locked,onActivate}:{charge:number;max:number;locked:boolean;onActivate:()=>void}){
 const {ready,percent}=ultimateReadiness(charge,max);
 return <div className="survivors-ultimate-control">
  <button type="button" className={`survivors-ultimate-btn ${ready&&!locked?'is-ready':''}`} onClick={onActivate} disabled={locked||!ready} aria-label={text.label} aria-describedby="survivors-ultimate-status">
   <span className="survivors-ultimate-icon" aria-hidden="true">📢</span>
   <span className="survivors-ultimate-info"><strong>{text.title}</strong><small>{ready?(locked?text.locked:text.ready):`${text.charge} ${percent}%`}</small><em>{ready?text.tap:text.charging}</em></span>
   <span className="survivors-ultimate-meter" role="progressbar" aria-label={text.charge} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{width:`${percent}%`}}/></span>
  </button>
  <span id="survivors-ultimate-status" className="survivors-ultimate-sr" role="status">{ready?(locked?text.locked:text.ready):text.charging}</span>
 </div>;
}
export function SurvivorsUltimateCoach({onActivate,onSkip}:{onActivate:()=>void;onSkip:()=>void}){
 const host=useRef<HTMLDivElement>(null),activate=useRef<HTMLButtonElement>(null);
 useEffect(()=>{const source=document.activeElement;activate.current?.focus();return()=>{if(source instanceof HTMLElement&&source.isConnected)source.focus();};},[]);
 return <div className="survivors-ultimate-coach-backdrop" onTouchStart={e=>e.stopPropagation()} onTouchMove={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}>
  <div ref={host} className="survivors-ultimate-coach" role="dialog" aria-modal="true" aria-labelledby="ultimate-coach-title" onKeyDown={e=>{
   if(e.code==='KeyF'&&!e.repeat){e.preventDefault();e.stopPropagation();onActivate();}
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onSkip();}
   if(e.key==='Tab'){const buttons=host.current?.querySelectorAll<HTMLButtonElement>('button');if(!buttons?.length)return;const first=buttons[0]!,last=buttons[buttons.length-1]!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  }}>
   <small>{text.coachPaused}</small><h2 id="ultimate-coach-title">{text.coachTitle}</h2><p>{text.coachBody}</p>
   <p className="survivors-ultimate-coach-keys">{text.coachKeyboard}</p>
   <button type="button" ref={activate} className="is-primary" onClick={onActivate}>{text.coachAction}</button>
   <button type="button" onClick={onSkip}>{text.coachSkip}</button><small>{text.coachClose}</small>
  </div>
 </div>;
}
