import type {DefenseTacticalReport} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';
import {defenseTowerArtUri} from '../app/defense-visual-assets';
import {guardFailureReview} from '../app/guard-tactical-report';
export function GuardTacticalDebrief({report,adviceId}:{report:DefenseTacticalReport;adviceId?:string}){
 const {stats}=report,clock=(tick:number)=>stats.tickMs?`${(tick*stats.tickMs/1000).toFixed(1)}s`:`#${tick}`;
 const largest=Math.max(1,...Object.values(stats.byFamily).map(s=>s?.damage??0));
 const review=guardFailureReview(report);
 return <section className="guard-tactical-review" data-tactical-run={report.runId}>
  <header><small>{t('guard.review')}</small><strong>{t(`guard.crew.${report.supportId}`)} · {t('guard.review.support')} {stats.supportUses}</strong></header>
  {stats.trackedFromTick>0||(stats.detailTrackedFromTick??0)>0?<p>{t('guard.review.partial')}</p>:null}
  <div className="guard-review-summary"><span>{t('guard.review.resolved')} <b>{stats.resolved}</b></span><span>{t('guard.review.peak')} <b>{stats.peakSignals}</b></span><span>E-STOP <b>{stats.eStopUses}</b></span></div>
  <ul className="guard-review-families">{Object.entries(stats.byFamily).sort(([,a],[,b])=>b.damage-a.damage).map(([family,row])=><li key={family} data-report-family={family}>
   <strong>{t(`defense.tower.${family}.name`)}</strong><span>{t('guard.lab_damage')} {row.damage} · {t('guard.review.resolved')} {row.resolved}</span><progress max={largest} value={row.damage} aria-label={t(`defense.tower.${family}.name`)}/>
  </li>)}</ul>
  {stats.bestClear?<p className="guard-review-best"><b>{stats.bestClear.padId} · {stats.bestClear.levelId}</b> {t('guard.review.best')} <strong>×{stats.bestClear.count}</strong> · {stats.bestClear.waveId}{t('guard.wave')}</p>:null}
  {adviceId?<p className="guard-review-advice">{t(adviceId)}</p>:null}
  {!report.won?<section className="guard-failure-review" aria-label={t('guard.review.failure')}>
   <strong>{t('guard.review.failure')}</strong>
   <p>{t('guard.review.recentLeaks')} · {review.sampleCount} / 24</p>
   {review.leaks.length?<ul>{review.leaks.map(([id,count])=><li key={id}>{t(`defense.enemy.${id}.name`)} ×{count}</li>)}</ul>:<p>{t('guard.review.noLeakDetail')}</p>}
   <p>{t(review.adviceId)}</p>
   {review.targetEvidence?<div className="guard-leak-targets"><b>{t('guard.review.targetsAtLeak')} · {review.targetEvidence.waveId}{t('guard.wave')} · {clock(review.targetEvidence.tick)}</b>
    {review.targetEvidence.targetsAtLeak!.length?<ul>{review.targetEvidence.targetsAtLeak!.map(target=><li key={target.padId}>{target.padId} · {t(`defense.ui.target.${target.targetMode}`)}</li>)}</ul>:<p>{t('guard.review.noTargetsAtLeak')}</p>}
   </div>:<small>{t('guard.review.noTargetDetail')}</small>}
   <p>{t('guard.review.retryBudget')}</p>
  </section>:null}
  <details className="guard-review-blueprint"><summary>{t('guard.review.blueprint')}</summary><div>{report.loadout.map(tower=><span key={tower.padId}><img src={defenseTowerArtUri(tower.towerId,tower.levelId,'guard-gd-01')??undefined} alt=""/><b>{tower.padId} · {tower.levelId}</b><small>{t(`defense.ui.target.${tower.targetMode}`)}</small></span>)}</div></details>
  {stats.waves.length?<details className="guard-review-waves"><summary>{t('guard.review.waves')}</summary><ol>{stats.waves.map(w=><li key={w.waveId}><b>{w.waveId}{t('guard.wave')}</b><span>{t('guard.review.resolved')} {w.resolved}</span><span>{t('guard.review.leaks')} {w.leaks}</span></li>)}</ol></details>:null}
  {stats.sensorWarnings?<p>{t('guard.pressure.review')} · {stats.sensorWarnings} / {stats.sensorInterruptions??0}</p>:null}
  {stats.byLevel?<details><summary>{t('guard.raid.levels')}</summary><ul>{Object.entries(stats.byLevel).map(([key,row])=><li key={key}><b>{t(`defense.tower.${key.split(':')[0]}.name`)} · {key.split(':')[1]}</b> · {t('guard.lab_damage')} {row.damage} · {t('guard.review.resolved')} {row.resolved}</li>)}</ul></details>:null}
  {stats.routeLeaks!==undefined?<details><summary>{t('guard.raid.leaks')}</summary><ol>{stats.routeLeaks.map((e,i)=><li key={i}><b>{e.waveId}{t('guard.wave')} · {e.routeId}</b> · {clock(e.tick)} · {t(`defense.enemy.${e.enemyId}.name`)}<br/>{e.firstContact?<span>{t('guard.raid.first')} {e.firstContact.padId} · ({Math.round(e.firstContact.point.x)}, {Math.round(e.firstContact.point.y)}) · {clock(e.firstContact.tick)}</span>:t('guard.raid.noContact')}</li>)}</ol></details>:<p>{t('guard.raid.partial')}</p>}
  {stats.supportEvents?.length?<details><summary>{t('guard.raid.supports')}</summary><ol>{stats.supportEvents.map((e,i)=><li key={i}>{e.waveId}{t('guard.wave')} · {clock(e.tick)} · {e.kind==='E_STOP'?'E-STOP':t(`guard.crew.${e.supportId}`)}</li>)}</ol></details>:null}
 </section>;
}
