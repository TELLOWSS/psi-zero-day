import type {DefenseContent,DefenseWaveDefinition} from '../domain/defense';
import {guardWaveIntel} from '../app/guard-wave-intel';
import {defenseText as t} from '../app/defense-text';
import {GUARD_PLANNING_STYLES,type GuardPlanningStyle} from '../app/guard-planning-style';
export function GuardWaveIntel({content,wave,style,onStyle}:{content:DefenseContent;wave:DefenseWaveDefinition;style:GuardPlanningStyle;onStyle:(style:GuardPlanningStyle)=>void}){
 const intel=guardWaveIntel(content,wave);
 return <details className="guard-wave-intel"><summary>{t('guard.intel')} · {t(`guard.style.${style}`)}</summary>
  <fieldset className="guard-planning-styles"><legend>{t('guard.style')}</legend>{GUARD_PLANNING_STYLES.map(id=><button key={id} type="button" data-planning-style={id} aria-pressed={id===style} onClick={()=>onStyle(id)}>{t(`guard.style.${id}`)}</button>)}</fieldset><small>{t(`guard.style.${style}.hint`)}</small>
  <p>{t('guard.intel.hint')}</p><ol>{intel.groups.map(group=><li key={group.index} data-intel-enemy={group.enemy}>
   <div><strong>{t(`defense.enemy.${group.enemy}.name`)} ×{group.count}</strong><small>{group.start.toFixed(1)}–{group.end.toFixed(1)}s</small></div>
   <div className="guard-wave-track" aria-hidden="true"><i style={{left:`${group.start/intel.duration*100}%`,width:`${Math.max(2,(group.end-group.start)/intel.duration*100)}%`}}/></div>
   <span>{t(`guard.intel.${group.enemy}`)}{group.armor>0?` · ${t('guard.intel.armor')} ${group.armor}%`:''}</span>
  </li>)}</ol>
 </details>;
}
