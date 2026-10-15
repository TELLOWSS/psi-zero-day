import {GuardTowerLab} from './GuardTowerLab';
import {isGuardMap} from '../content/guard-campaign';
import type {DefenseContent, DefenseTowerState, DefenseCommand} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';
import {defenseG8aTowerVisual, defenseTowerArtUri} from '../app/defense-visual-assets';
import type {DefenseAdvice} from '../app/defense-tactics';

export function DefenseTechTree({content,tower,resource,advice,onCommand,ultimateAvailable=false}: {
  readonly content: DefenseContent; readonly tower: DefenseTowerState; readonly resource: number;
  readonly advice: DefenseAdvice | null; readonly onCommand: (command: DefenseCommand) => void;
  readonly ultimateAvailable?:boolean;
}) {
  const definition = content.towers.find(item=>item.id===tower.towerId)!;
  const current = definition.levels.find(item=>item.id===tower.levelId)!;
  return <section className="zb-tech-tree" aria-label={t('defense.tactics.tree')}>
    <header><strong>{t('defense.tactics.tree')}</strong><small>{t('defense.tactics.tree_hint')}</small></header>
    <div className="zb-tech-nodes">
      {definition.levels.map(level=>{
        const active=level.id===current.id;
        const lockedUltimate=level.id.startsWith('L4')&&!ultimateAvailable;
        const next=level.from===current.id&&!lockedUltimate;
        const passed=(level.id==='L1'&&current.id!=='L1')||(level.id==='L2'&&current.id!=='L1'&&current.id!=='L2')||(current.from===level.id);
        const recommended=advice?.command.type==='Upgrade'&&advice.command.towerInstanceId===tower.id&&advice.command.levelId===level.id;
        const art=defenseG8aTowerVisual(content.map.id,tower.towerId,level.id)?.uri??defenseTowerArtUri(tower.towerId,level.id,content.map.id);
        return <button key={level.id} type="button" data-level={level.id} data-tree-state={active?'current':passed?'completed':next?'available':'locked'}
          aria-current={active?'step':undefined} disabled={!next||resource<level.cost} data-recommended={recommended?'true':undefined}
          onClick={()=>onCommand({type:'Upgrade',towerInstanceId:tower.id,levelId:level.id})}>
          {art?<img src={art} alt=""/>:null}
          <span className="zb-tech-label"><small>{level.id} · {t(active?'defense.tactics.current':passed?'defense.tactics.completed':next?'defense.tactics.available':'defense.tactics.unselected')}</small>
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
    {isGuardMap(content.map.id)?<GuardTowerLab key={tower.id} content={content} tower={tower}/>:null}
    <p>{t('defense.tactics.cost_hint')} <b>R {tower.invested}</b> · {t('defense.tactics.resource')} <b>R {resource}</b></p>
  </section>;
}
