import type {DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';
import {defenseEnemyPath} from '../engine/defense-geometry';
import {defenseVisualPadPoint,defenseVisualPositionAtDistance} from '../app/defense-visual-projection';

export function guardPressureReadout(state:DefenseRunState,content:DefenseContent):string|undefined{
 if(!state.sensorPressureEnabled)return;
 const core=state.enemies.find(e=>e.sensorPressure?.phase==='ACTIVE')??state.enemies.find(e=>e.sensorPressure?.phase==='WARNING');
 const p=core?.sensorPressure;if(!p)return;
 return `${t('guard.pressure.'+p.phase)} · ${p.targetPadId} · ${Math.ceil(p.remainingTicks*content.tickMs/1000)}s`;
}
/** The connector is a targeting annotation over existing production actors, not a projectile. */
export function GuardSensorPressureOverlay({content,state,rotated=false}:{content:DefenseContent;state:DefenseRunState;rotated?:boolean}){
 if(!state.sensorPressureEnabled)return null;
 return <g pointerEvents="none" aria-hidden="true">{state.enemies.filter(e=>e.sensorPressure&&e.sensorPressure.phase!=='SPENT').map(e=>{
  const p=e.sensorPressure!,point=defenseVisualPositionAtDistance(content.map.id,defenseEnemyPath(content,e,state),e.distance),pad=content.map.pads.find(pad=>pad.id===p.targetPadId),target=pad?defenseVisualPadPoint(content.map.id,pad):null;
  const active=p.phase==='ACTIVE',color=active?'#fda4af':'#fbbf24';
  return <g key={e.id} data-pressure-phase={p.phase} data-pressure-target={p.targetPadId??''}>
   {target?<line x1={point.x} y1={point.y} x2={target.x} y2={target.y} stroke={color} strokeWidth={3} strokeDasharray={active?'3 5':'12 8'}/>:null}
   <g transform={`translate(${point.x} ${point.y})${rotated?' rotate(-90)':''}`}><circle r={34} fill="none" stroke={color} strokeWidth={3} strokeDasharray="6 5"/><text y={-48} textAnchor="middle" fill={color} fontSize={15} fontWeight={800}>{t('guard.pressure.core')}</text></g>
   {target?<g transform={`translate(${target.x} ${target.y})${rotated?' rotate(-90)':''}`}><circle r={39} fill="none" stroke={color} strokeWidth={3}/><text x={30} y={-30} fill={color} fontSize={30} fontWeight={900}>{active?'×':'!'}</text></g>:null}
  </g>;
 })}</g>;
}
