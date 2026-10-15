import {GuardTowerLab} from './GuardTowerLab';
import {useState} from 'react';
import {guardEvolutionState} from '../app/guard-evolution';
import {isGuardMap} from '../content/guard-campaign';
import type {DefenseContent, DefenseTowerState, DefenseCommand} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';
import {defenseG8aTowerVisual, defenseTowerArtUri} from '../app/defense-visual-assets';
import type {DefenseAdvice} from '../app/defense-tactics';

export function DefenseTechTree({content,tower,resource,advice,onCommand,ultimateAvailable=false,compact=false}: {
  readonly content: DefenseContent; readonly tower: DefenseTowerState; readonly resource: number;
  readonly advice: DefenseAdvice | null; readonly onCommand: (command: DefenseCommand) => void;
  readonly ultimateAvailable?:boolean;
  readonly compact?:boolean;
}) {
  const definition = content.towers.find(item=>item.id===tower.towerId)!;
  const current = definition.levels.find(item=>item.id===tower.levelId)!;
  const guard=isGuardMap(content.map.id),[previewId,setPreviewId]=useState<string|null>(null);
  const [showAll,setShowAll]=useState(false);
  const levels=compact&&!showAll?definition.levels.filter(level=>level.from===current.id):definition.levels;
  const preview=definition.levels.find(l=>l.id===previewId),canApply=preview&&guardEvolutionState(definition,tower,preview,resource,ultimateAvailable)==='available';
  return <section className="zb-tech-tree" data-compact={compact?'true':undefined} aria-label={t('defense.tactics.tree')}>
    <header><strong>{t(compact?'guard.mobile.next_upgrade':'defense.tactics.tree')}</strong>{compact?<button type="button" className="guard-tree-toggle" aria-expanded={showAll} onClick={()=>setShowAll(value=>!value)}>{t(showAll?'guard.mobile.next_only':'guard.mobile.all_branches')}</button>:<small>{t('defense.tactics.tree_hint')}</small>}</header>
    {compact?<p className="guard-current-level" data-final={!levels.length?'true':undefined}>{current.id} · {t('defense.tactics.equipped')}{!levels.length?` · ${t('guard.mobile.max_level')}`:''}</p>:null}
    <div className="zb-tech-nodes">
      {guard?<svg className="guard-tech-connectors" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true"><path d="M100 100H300M300 100L400 50H700M300 100L400 150H700"/></svg>:null}
      {levels.map(level=>{
        const active=level.id===current.id;
        const lockedUltimate=level.id.startsWith('L4')&&!ultimateAvailable;
        const next=level.from===current.id&&!lockedUltimate;
        const passed=(level.id==='L1'&&current.id!=='L1')||(level.id==='L2'&&current.id!=='L1'&&current.id!=='L2')||(current.from===level.id);
        const recommended=advice?.command.type==='Upgrade'&&advice.command.towerInstanceId===tower.id&&advice.command.levelId===level.id;
        const nodeState=guard?guardEvolutionState(definition,tower,level,resource,ultimateAvailable):active?'current':passed?'completed':next?'available':'locked';
        const art=defenseG8aTowerVisual(content.map.id,tower.towerId,level.id)?.uri??defenseTowerArtUri(tower.towerId,level.id,content.map.id);
        return <button key={level.id} type="button" data-level={level.id} data-tree-state={nodeState}
          aria-current={active?'step':undefined} aria-pressed={guard?previewId===level.id:undefined} disabled={!guard&&(!next||resource<level.cost)} data-recommended={recommended?'true':undefined}
          onClick={()=>guard?setPreviewId(level.id):onCommand({type:'Upgrade',towerInstanceId:tower.id,levelId:level.id})}>
          {art?<img src={art} alt=""/>:null}
          <span className="zb-tech-label"><small>{level.from?`${level.from} → `:''}{level.id} · {t(guard?`guard.evolution.state.${nodeState}`:active?'defense.tactics.current':passed?'defense.tactics.completed':next?'defense.tactics.available':'defense.tactics.unselected')}</small>
            <strong>{level.id.startsWith('L4')?t(`guard.${tower.towerId}.${level.id}.name`):level.id.startsWith('L3')?t(`defense.tower.${tower.towerId}.${level.id}.name`):level.id==='L2'?`${t('defense.ui.upgrade')} L2 · ${t('defense.tactics.L2')}`:t('defense.tactics.L1')}</strong>{level.id.startsWith('L4')?<em>{t(lockedUltimate?'guard.ultimate.locked':`guard.${tower.towerId}.${level.id}`)}</em>:null}</span>
          <span className="zb-tech-metrics">{isGuardMap(content.map.id)&&level.id.startsWith("L3")?<><em>{t(`guard.${tower.towerId}.${level.id}`)}</em><br/></>:null}{t(level.damageType==='PURE'?'defense.tactics.pure':'defense.ui.damage')} {level.damage} · {t('defense.ui.interval')} {(level.intervalTicks*content.tickMs/1000).toFixed(2)}s<br/>
            {t('defense.ui.range')} {level.range} · {t('defense.tactics.targets')} {level.maxTargets}
            {level.splashRadius>0?<><br/>{t('defense.tactics.radius')} {level.splashRadius}</>:null}
            {level.slowFraction>0?<><br/>{t('defense.tactics.slow')} {Math.round(level.slowFraction*100)}% · {(level.slowTicks*content.tickMs/1000).toFixed(1)}s</>:null}
            {level.revealRadius>0?<><br/>{t('defense.tactics.detect')} {level.revealRadius} · {(level.revealTicks*content.tickMs/1000).toFixed(1)}s</>:null}
          </span>
          <b>{active?t('defense.tactics.equipped'):passed?'✓':`R ${level.cost}`}{recommended?` · ${t('defense.tactics.recommended')}`:''}</b>
        </button>;
      })}
    </div>
    {guard&&preview?<section className="guard-evolution-decision" aria-label={t('guard.evolution.preview')}>
      <strong>{t('guard.evolution.preview')} · {preview.id}</strong>
      <p>{t(`guard.${tower.towerId}.${preview.id}.tradeoff`)}</p>
      <div><span>{t('guard.evolution.before')} {current.damage} → {preview.damage}</span><span>{t('guard.evolution.interval')} {(current.intervalTicks*content.tickMs/1000).toFixed(2)}s → {(preview.intervalTicks*content.tickMs/1000).toFixed(2)}s</span><span>{t('defense.ui.range')} {current.range} → {preview.range}</span></div>
      <p>{t('guard.evolution.cost')} R {preview.cost} · {t('guard.evolution.investment')} R {tower.invested}{preview.from===current.id&&resource>=preview.cost?` → ${tower.invested+preview.cost} · ${t('guard.evolution.after')} R ${resource-preview.cost}`:''}</p>
      <button className="guard-evolution-confirm" disabled={!canApply} onClick={()=>{if(canApply){onCommand({type:'Upgrade',towerInstanceId:tower.id,levelId:preview.id});setPreviewId(null);}}}>{t('guard.evolution.confirm')} · {preview.id} · R {preview.cost}</button>
      <button onClick={()=>setPreviewId(null)}>{t('guard.evolution.cancel')}</button>
    </section>:null}
    {isGuardMap(content.map.id)?<GuardTowerLab key={tower.id} content={content} tower={tower}/>:null}
    <p>{t('defense.tactics.cost_hint')} <b>R {tower.invested}</b> · {t('defense.tactics.resource')} <b>R {resource}</b></p>
  </section>;
}
