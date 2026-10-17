import type {DefenseContent,DefenseRunState,DefenseWaveDefinition} from '../domain/defense';
import {GuardPreparationCheck} from './GuardPreparationCheck';
import {guardWaveIntel} from '../app/guard-wave-intel';
import {defenseText as t} from '../app/defense-text';
import {GUARD_PLANNING_STYLES,type GuardPlanningStyle} from '../app/guard-planning-style';
export function GuardWaveIntel({content,state,wave,style,onStyle,initiallyOpen=false,pressureEnabled=true}:{content:DefenseContent;state?:DefenseRunState;wave:DefenseWaveDefinition;style:GuardPlanningStyle;onStyle:(style:GuardPlanningStyle)=>void;initiallyOpen?:boolean;pressureEnabled?:boolean}){
 const intel=guardWaveIntel(content,wave,pressureEnabled);
 return <details className="guard-wave-intel" open={initiallyOpen||undefined}><summary>{t('guard.intel')} · {t(`guard.style.${style}`)}</summary>
  {state?<GuardPreparationCheck content={content} state={state} wave={wave}/>:null}
  <fieldset className="guard-planning-styles"><legend>{t('guard.style')}</legend>{GUARD_PLANNING_STYLES.map(id=><button key={id} type="button" data-planning-style={id} aria-pressed={id===style} onClick={()=>onStyle(id)}>{t(`guard.style.${id}`)}</button>)}</fieldset><small>{t(`guard.style.${style}.hint`)}</small>
  {pressureEnabled&&content.sensorPressure?.waves.includes(wave.id)?<p>{t('guard.pressure.prepare')}</p>:null}
  <p>{t('guard.intel.hint')}</p><ol>{intel.groups.map(group=><li key={group.index} data-intel-enemy={group.enemy}>
   <div><strong>{group.cores?`${t('guard.pressure.core')} · ${t(`defense.enemy.${group.enemy}.name`)} ×1`:`${t(`defense.enemy.${group.enemy}.name`)} ×${group.count}`}</strong><small>{t('guard.raid.route')} {group.routeId} · {group.start.toFixed(1)}–{group.end.toFixed(1)}s</small></div>
   <div className="guard-wave-track" aria-hidden="true"><i style={{left:`${group.start/intel.duration*100}%`,width:`${Math.max(2,(group.end-group.start)/intel.duration*100)}%`}}/></div>
   <span>{t(`guard.intel.${group.enemy}`)}{group.armor>0?` · ${t('guard.intel.armor')} ${group.armor}%`:''}</span>
  </li>)}</ol>
 </details>;
}
