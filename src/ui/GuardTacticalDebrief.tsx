import type {DefenseTacticalReport} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';
import {defenseTowerArtUri} from '../app/defense-visual-assets';
export function GuardTacticalDebrief({report,adviceId}:{report:DefenseTacticalReport;adviceId?:string}){
 const {stats}=report,largest=Math.max(1,...Object.values(stats.byFamily).map(s=>s?.damage??0));
 return <section className="guard-tactical-review" data-tactical-run={report.runId}>
  <header><small>{t('guard.review')}</small><strong>{t(`guard.crew.${report.supportId}`)} · {t('guard.review.support')} {stats.supportUses}</strong></header>
  {stats.trackedFromTick>0?<p>{t('guard.review.partial')}</p>:null}
  <div className="guard-review-summary"><span>{t('guard.review.resolved')} <b>{stats.resolved}</b></span><span>{t('guard.review.peak')} <b>{stats.peakSignals}</b></span><span>E-STOP <b>{stats.eStopUses}</b></span></div>
  <ul className="guard-review-families">{Object.entries(stats.byFamily).sort(([,a],[,b])=>b.damage-a.damage).map(([family,row])=><li key={family} data-report-family={family}>
   <strong>{t(`defense.tower.${family}.name`)}</strong><span>{t('guard.lab_damage')} {row.damage} · {t('guard.review.resolved')} {row.resolved}</span><progress max={largest} value={row.damage} aria-label={t(`defense.tower.${family}.name`)}/>
  </li>)}</ul>
  {stats.bestClear?<p className="guard-review-best"><b>{stats.bestClear.padId} · {stats.bestClear.levelId}</b> {t('guard.review.best')} <strong>×{stats.bestClear.count}</strong> · {stats.bestClear.waveId}{t('guard.wave')}</p>:null}
  {adviceId?<p className="guard-review-advice">{t(adviceId)}</p>:null}
  <details className="guard-review-blueprint"><summary>{t('guard.review.blueprint')}</summary><div>{report.loadout.map(tower=><span key={tower.padId}><img src={defenseTowerArtUri(tower.towerId,tower.levelId,'guard-gd-01')??undefined} alt=""/><b>{tower.padId} · {tower.levelId}</b><small>{t(`defense.ui.target.${tower.targetMode}`)}</small></span>)}</div></details>
  {stats.waves.length?<details className="guard-review-waves"><summary>{t('guard.review.waves')}</summary><ol>{stats.waves.map(w=><li key={w.waveId}><b>{w.waveId}{t('guard.wave')}</b><span>{t('guard.review.resolved')} {w.resolved}</span><span>{t('guard.review.leaks')} {w.leaks}</span></li>)}</ol></details>:null}
 </section>;
}
