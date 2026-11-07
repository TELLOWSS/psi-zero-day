import {encounterIntelTitle,openEncounterIntel} from '../app/signal-encounter-intel';
import {useState} from 'react';
import {useDialogFocus} from './useDialogFocus';
import {MissionStatusRail} from './MissionStatusRail';
import type {DefenseSaveDocument} from '../domain';
import {guardContents,guardStageUnlocked} from '../content/guard-campaign';
import {defenseText as t} from '../app/defense-text';
import {DEFENSE_PREMIUM_HERO} from '../app/defense-premium-art';
import art from '../../content/defense/guard-art-v1.json';
import p2 from '../../content/defense/guard-p2-art-v1.json';
import './guard-campaign.css';
import './psi-experience-ui.css';
import {GuardTacticalDebrief} from './GuardTacticalDebrief';
import {GuardStagePreview} from './GuardStagePreview';

export function GuardCampaignHome({document,onSelect,onResume,onExit,onPractice}:{document:DefenseSaveDocument;onSelect:(id:string,replace:boolean,mastery:boolean)=>void;onResume?:()=>void;onExit:()=>void;onPractice?:()=>void}){
 const [pending,setPending]=useState<string|null>(null);
 const [masterySelected,setMasterySelected]=useState(false);
 const replacementDialog=useDialogFocus(Boolean(pending),()=>setPending(null));
 const active=document.activeRun&&!['WON','LOST'].includes(document.activeRun.status);
 const cleared=guardContents.filter(c=>document.records.some(r=>r.scenarioId===c.scenario.id&&r.clears>0)).length;
 const next=guardContents.find(c=>guardStageUnlocked(c.scenario.id,document)&&!document.records.some(r=>r.scenarioId===c.scenario.id&&r.clears>0));
 const masteryUnlocked=cleared===guardContents.length;
 const mastered=guardContents.filter(c=>(document.records.find(r=>r.scenarioId===c.scenario.id)?.bestMasteryStars??0)===3).length;
 const priority=guardContents.find(c=>(document.records.find(r=>r.scenarioId===c.scenario.id)?.bestMasteryStars??0)<3)??guardContents[0];
 return <main className="guard-home" data-defense-screen="guard-home" data-selected-mode={masterySelected?"mastery":"regular"}>
  <header className="guard-home-hero" style={{backgroundImage:`linear-gradient(90deg,#071b27ed,#071b2755),url(/${DEFENSE_PREMIUM_HERO})`}}>
   <nav><span>SIGNAL GUARD</span><button type="button" onClick={openEncounterIntel}>{encounterIntelTitle}</button><button onClick={onExit}>{t('guard.hub')}</button></nav>
   <small>{t('guard.subtitle')}</small><h1>{t('guard.title')}</h1><p>{t('guard.promise')}</p>
   {active&&onResume?<button className="guard-primary" onClick={onResume}>{t('guard.resume')}</button>:null}
   {!active&&next?<button className="guard-primary" onClick={()=>onSelect(next.scenario.id,false,false)}>{t('guard.next')} · {t(`guard.gd0${guardContents.indexOf(next)+1}.title`)}</button>:null}
   <span className="guard-progress">{t('guard.chapter')} · {cleared} / {guardContents.length} {t('guard.clear')}</span>
  </header>
  <MissionStatusRail mode="guard" label="현재 가드 작전 준비 현황" items={[
    {label:"작전 진행",value:`${cleared} / ${guardContents.length}`,note:next?"다음 작전 진행 가능":"전체 작전 완료"},
    {label:"선택 난이도",value:masterySelected&&masteryUnlocked?"MASTER":"STANDARD",note:masteryUnlocked?"일반·마스터 자유 선택":"6개 완료 후 마스터 개방"},
    {label:"마스터 3성",value:masteryUnlocked?`${mastered} / 6`:"잠김",note:masteryUnlocked?"기존 기록과 별도 저장":"기존 기록은 유지"}
  ]}/>
  {masteryUnlocked&&priority?<section className="guard-veteran-command" aria-label="마스터 작전 지휘판">
    <div className="guard-veteran-copy"><small>RE:IGNITION · SIGNAL GUARD / VETERAN</small>
      <h2>6개 작전을 마쳤다면, 이제 공략을 증명할 차례.</h2>
      <p>일반 클리어와 마스터 최고기록은 별도로 유지됩니다. 작전마다 중점 위협과 실드 손실 조건이 달라집니다.</p>
      <div className="guard-veteran-objective" data-guard-replay-objective="true"><span>다음 전술 목표</span><strong>GD-0{guardContents.indexOf(priority)+1} · {t('guard.gd0'+(guardContents.indexOf(priority)+1)+'.title')}</strong><small>마스터 최고 ★{document.records.find(r=>r.scenarioId===priority.scenario.id)?.bestMasteryStars??0}/3 · {priority.waves.length}개 웨이브 · 적 특성에 따른 타워 재배치</small></div>
    </div>
    <div className="guard-veteran-record" aria-label={`마스터 별 세 개 달성 ${mastered}개 중 6개`}>
      <strong>{mastered}<span>/ 6</span></strong><small>MASTER ★★★</small>
      <div className="guard-veteran-cells">{guardContents.map((c,i)=><span key={c.scenario.id} data-cleared={(document.records.find(r=>r.scenarioId===c.scenario.id)?.bestMasteryStars??0)===3} title={`GD-0${i+1} · 마스터 최고 별 ${document.records.find(r=>r.scenarioId===c.scenario.id)?.bestMasteryStars??0}`}>{i+1}</span>)}</div>
    </div>
    {active&&onResume?<button type="button" onClick={onResume}>진행 중인 작전 이어하기</button>:<button type="button" className="guard-veteran-go" onClick={()=>onSelect(priority.scenario.id,false,true)}>GD-0{guardContents.indexOf(priority)+1} · 마스터 작전 준비 →</button>}
  </section>:null}
  {masteryUnlocked?<section className="guard-mastery-choice" aria-label="작전 난이도" data-selected-mode={masterySelected?"mastery":"regular"}>
   <strong>모든 작전 완료 · 마스터 도전 해금</strong>
   <div role="group" aria-label="작전 난이도">
    <button type="button" aria-pressed={!masterySelected} onClick={()=>setMasterySelected(false)}>일반 재도전</button>
    <button type="button" aria-pressed={masterySelected} onClick={()=>setMasterySelected(true)}>마스터 도전</button>
   </div>
   <small>마스터 도전은 적 유형별 내구도와 고속·은폐 위험의 압박이 강화됩니다. 기존 별과 보상을 유지하며 마스터 최고 별을 따로 저장합니다.</small>
  </section>:null}
  <section className="guard-operations"><h2>{t(cleared===guardContents.length?'guard.complete':'guard.chapter')}</h2><p>{t(cleared===guardContents.length?'guard.complete_hint':'guard.chapter_hint')}</p>
   <div className="guard-stage-grid">{guardContents.map((content,i)=>{
    const record=document.records.find(r=>r.scenarioId===content.scenario.id),unlocked=guardStageUnlocked(content.scenario.id,document),key=`guard.gd0${i+1}`;
    return <article key={key} className={unlocked?'is-unlocked':'is-locked'} data-guard-stage={content.scenario.id}>
     <GuardStagePreview content={content} uri={'/'+[...art.boards,...p2.boards][i]!.uri}/><div><span className="guard-stage-state" data-state={!unlocked?"locked":record?.clears?"cleared":"ready"}>{!unlocked?"LOCKED":record?.clears?"CLEARED":"READY"}</span><small>GD-0{i+1} · {t(i<3?'guard.surface':'guard.underground')} · {content.waves.length}{t('guard.wave')} <span>{'★'.repeat(masterySelected?(record?.bestMasteryStars??0):(record?.bestStars??0))}</span></small>
     <span className="guard-stage-tactic">{t(key+'.tactic')}</span>
     <h3>{t(key+'.title')}</h3><p>{t(key+'.hint')}</p><button type="button" disabled={!unlocked} aria-label={`GD-0${i+1} ${t(key+'.title')} · ${!unlocked?"잠금":masterySelected&&masteryUnlocked?"마스터 작전":"일반 작전"} 선택`} onClick={()=>active?setPending(content.scenario.id):onSelect(content.scenario.id,false,masterySelected&&masteryUnlocked)}>{!unlocked?t('guard.locked'):masterySelected&&masteryUnlocked?"마스터 작전 선택":t('guard.start')} <span aria-hidden="true">↗</span></button>
     {record?.lastTacticalReport?.contentVersion===content.contentVersion?<details className="guard-last-report"><summary>{t('guard.review.last')}</summary><GuardTacticalDebrief report={record.lastTacticalReport}/></details>:null}</div>
    </article>;
   })}</div>
  </section>
  <footer><strong>{t('guard.crew')}</strong><p>{t('guard.crew_hint')}</p><small>{t('guard.boundary')}</small>{onPractice?<button onClick={onPractice}>{t('guard.practice')}</button>:null}</footer>
  {pending?<div ref={replacementDialog.dialogRef} onKeyDown={replacementDialog.onKeyDown} className="guard-replace" role="dialog" aria-modal="true" aria-labelledby="guard-replace-title"><section><h2 id="guard-replace-title">{t('guard.replace')}</h2><p>{t('guard.replace_hint')}</p><button onClick={()=>{onSelect(pending,true,masterySelected&&masteryUnlocked);setPending(null);}}>{t('guard.confirm')}</button><button ref={replacementDialog.closeRef} type="button" onClick={()=>setPending(null)}>{t('guard.cancel')}</button></section></div>:null}
 </main>;
}
