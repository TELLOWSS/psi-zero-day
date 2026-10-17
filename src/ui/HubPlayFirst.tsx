import {useRef,useState} from 'react';
import type {KeyboardEvent} from 'react';
import {GAME_TITLE} from '../app/brand';
import './hub-play-first.css';

const modes=['guard','watch','breaker'] as const;
type Mode=typeof modes[number];
export function HubPlayFirst({t,onGuard,onWatch,onStory}:{t:(id:string)=>string;onGuard?:()=>void;onWatch?:()=>void;onStory:()=>void}){
 const [mode,setMode]=useState<Mode>('guard');const dialog=useRef<HTMLDialogElement>(null);
 const key=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
  const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:null;
  if(next===null)return;event.preventDefault();setMode(modes[next]!);document.getElementById('pf-mode-'+modes[next])?.focus();
 };
 const title=t(`ui.home.${mode}.title`),image=`/assets/branding/home-v3/${mode}-gameplay.png`;
 return <section className="hub-play-first" aria-label={t('ui.home.label')}>
  <div className="pf-hero">
   <img className="pf-key-art" src="/assets/branding/home-v3/decision-at-the-junction-harness-v2.png" alt="" width="1672" height="941" fetchPriority="high"/>
   <div className="pf-hero-shade"/>
   <div className="pf-hero-copy"><img src="/assets/branding/new-psi-wordmark-stacked-chalk.svg" width="460" height="144" alt={GAME_TITLE}/><p>{t('ui.hub.home_name')}</p><h1>{t('ui.home.promise')}</h1><span>{t('ui.home.world')}</span></div>
  </div>
  <div className="pf-library-heading"><h2>{t('ui.home.choose')}</h2><button type="button" onClick={onStory}>{t('ui.home.story')}</button></div>
  <div className="pf-modes" role="tablist" aria-label={t('ui.home.choose')}>
   {modes.map((id,index)=><button key={id} id={'pf-mode-'+id} type="button" role="tab" aria-selected={mode===id} aria-controls="pf-panel" tabIndex={mode===id?0:-1} onKeyDown={e=>key(e,index)} onClick={()=>setMode(id)}><strong>{t(`ui.home.${id}.title`)}</strong><small>{t(`ui.home.${id}.genre`)}</small><span aria-hidden="true">{mode===id?'●':'○'}</span></button>)}
  </div>
  <div className="pf-mode-content" id="pf-panel" role="tabpanel" aria-labelledby={'pf-mode-'+mode} data-home-mode={mode}>
   <div className="pf-copy"><small>{t(`ui.home.${mode}.genre`)}</small><h2>{title}</h2><p>{t(`ui.home.${mode}.description`)}</p>
    <ol className="pf-actions">{[1,2,3].map(step=><li key={step}><span>{step}</span>{t(`ui.home.${mode}.step${step}`)}</li>)}</ol>
    {mode==='breaker'?<a className="pf-start" href="/signal-breaker-dev/index.html?entry=play">{t('ui.home.breaker.start')} <span aria-hidden="true">↗</span></a>:<button className="pf-start" type="button" onClick={mode==='guard'?onGuard:onWatch} disabled={mode==='guard'?!onGuard:!onWatch}>{t(`ui.home.${mode}.start`)} <span aria-hidden="true">→</span></button>}
   </div>
   <div className="pf-play-preview"><button type="button" className="pf-preview-button" onClick={()=>dialog.current?.showModal()} aria-label={`${title} · ${t('ui.home.expand')}`}><img key={mode} src={image} width="1280" height="800" alt={`${title} · ${t('ui.home.actual')}`}/><span>{t('ui.home.expand')} ↗</span></button><p>{t('ui.home.actual')}</p></div>
  </div>
  <dialog className="pf-preview-dialog" ref={dialog} aria-label={`${title} · ${t('ui.home.actual')}`} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button type="button" onClick={()=>dialog.current?.close()} autoFocus>{t('ui.home.close')}</button><img src={image} alt={`${title} · ${t('ui.home.actual')}`}/><p>{t('ui.home.actual')}</p></dialog>
 </section>;
}
