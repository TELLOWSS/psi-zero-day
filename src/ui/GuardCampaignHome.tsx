import {useState} from 'react';
import type {DefenseSaveDocument} from '../domain';
import {guardContents,guardStageUnlocked} from '../content/guard-campaign';
import {defenseText as t} from '../app/defense-text';
import {DEFENSE_PREMIUM_HERO} from '../app/defense-premium-art';
import art from '../../content/defense/guard-art-v1.json';
import p2 from '../../content/defense/guard-p2-art-v1.json';
import './guard-campaign.css';
import {GuardTacticalDebrief} from './GuardTacticalDebrief';

export function GuardCampaignHome({document,onSelect,onResume,onExit,onPractice}:{document:DefenseSaveDocument;onSelect:(id:string,replace:boolean)=>void;onResume?:()=>void;onExit:()=>void;onPractice?:()=>void}){
 const [pending,setPending]=useState<string|null>(null);
 const active=document.activeRun&&!['WON','LOST'].includes(document.activeRun.status);
 const cleared=guardContents.filter(c=>document.records.some(r=>r.scenarioId===c.scenario.id&&r.clears>0)).length;
 const next=guardContents.find(c=>guardStageUnlocked(c.scenario.id,document)&&!document.records.some(r=>r.scenarioId===c.scenario.id&&r.clears>0));
 return <main className="guard-home" data-defense-screen="guard-home">
  <header className="guard-home-hero" style={{backgroundImage:`linear-gradient(90deg,#071b27ed,#071b2755),url(/${DEFENSE_PREMIUM_HERO})`}}>
   <nav><span>SIGNAL GUARD</span><button onClick={onExit}>{t('guard.hub')}</button></nav>
   <small>{t('guard.subtitle')}</small><h1>{t('guard.title')}</h1><p>{t('guard.promise')}</p>
   {active&&onResume?<button className="guard-primary" onClick={onResume}>{t('guard.resume')}</button>:null}
   {!active&&next?<button className="guard-primary" onClick={()=>onSelect(next.scenario.id,false)}>{t('guard.next')} · {t(`guard.gd0${guardContents.indexOf(next)+1}.title`)}</button>:null}
   <span className="guard-progress">{t('guard.chapter')} · {cleared} / {guardContents.length} {t('guard.clear')}</span>
  </header>
  <section className="guard-operations"><h2>{t(cleared===guardContents.length?'guard.complete':'guard.chapter')}</h2><p>{t(cleared===guardContents.length?'guard.complete_hint':'guard.chapter_hint')}</p>
   <div className="guard-stage-grid">{guardContents.map((content,i)=>{
    const record=document.records.find(r=>r.scenarioId===content.scenario.id),unlocked=guardStageUnlocked(content.scenario.id,document),key=`guard.gd0${i+1}`;
    return <article key={key} className={unlocked?'is-unlocked':'is-locked'} data-guard-stage={content.scenario.id}>
     <img src={'/'+[...art.boards,...p2.boards][i]!.uri} alt=""/><div><small>GD-0{i+1} · {t(i<3?'guard.surface':'guard.underground')} · {content.waves.length}{t('guard.wave')} <span>{'★'.repeat(record?.bestStars??0)}</span></small>
     <h3>{t(key+'.title')}</h3><p>{t(key+'.hint')}</p><button disabled={!unlocked} onClick={()=>active?setPending(content.scenario.id):onSelect(content.scenario.id,false)}>{t(unlocked?'guard.start':'guard.locked')}</button>
     {record?.lastTacticalReport?.contentVersion===content.contentVersion?<details className="guard-last-report"><summary>{t('guard.review.last')}</summary><GuardTacticalDebrief report={record.lastTacticalReport}/></details>:null}</div>
    </article>;
   })}</div>
  </section>
  <footer><strong>{t('guard.crew')}</strong><p>{t('guard.crew_hint')}</p><small>{t('guard.boundary')}</small>{onPractice?<button onClick={onPractice}>{t('guard.practice')}</button>:null}</footer>
  {pending?<div className="guard-replace" role="dialog" aria-modal="true" aria-labelledby="guard-replace-title"><section><h2 id="guard-replace-title">{t('guard.replace')}</h2><p>{t('guard.replace_hint')}</p><button onClick={()=>{onSelect(pending,true);setPending(null);}}>{t('guard.confirm')}</button><button onClick={()=>setPending(null)}>{t('guard.cancel')}</button></section></div>:null}
 </main>;
}
