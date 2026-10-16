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

/** Read-only targeting instrumentation. Countdown follows engine ticks, including pause/freeze. */
export function GuardSensorPressureOverlay({content,state,rotated=false}:{content:DefenseContent;state:DefenseRunState;rotated?:boolean}){
 if(!state.sensorPressureEnabled)return null;
 return <g className="guard-pressure-instruments" pointerEvents="none" aria-hidden="true">{state.enemies.filter(e=>e.sensorPressure&&e.sensorPressure.phase!=='SPENT').map(e=>{
  const p=e.sensorPressure!,point=defenseVisualPositionAtDistance(content.map.id,defenseEnemyPath(content,e,state),e.distance);
  const pad=content.map.pads.find(pad=>pad.id===p.targetPadId),target=pad?defenseVisualPadPoint(content.map.id,pad):null;
  const engaged=p.phase==='WARNING'||p.phase==='ACTIVE';
  const duration=p.phase==='ACTIVE'?content.sensorPressure?.activeTicks:content.sensorPressure?.warningTicks;
  const remaining=duration?Math.max(0,Math.min(1,p.remainingTicks/duration)):0;
  const seconds=Math.ceil(p.remainingTicks*content.tickMs/1000);
  const screenX=rotated?content.map.height-point.y:point.x;
  const screenWidth=rotated?content.map.height:content.map.width;
  const labelX=Math.max(48,Math.min(screenWidth-48,screenX))-screenX;
  const dx=target?target.x-point.x:0,dy=target?target.y-point.y:0,distance=Math.hypot(dx,dy);
  const link=target&&distance>92?{x1:point.x+dx/distance*40,y1:point.y+dy/distance*40,x2:target.x-dx/distance*48,y2:target.y-dy/distance*48}:null;
  return <g key={e.id} className={`guard-pressure-state is-${p.phase.toLowerCase()}`} data-pressure-phase={p.phase} data-pressure-target={p.targetPadId??''}>
   {engaged&&link?<g className="guard-pressure-link">
    <line {...link} className="guard-pressure-link-shadow"/>
    <line {...link} className="guard-pressure-link-signal"/>
   </g>:null}
   <g transform={`translate(${point.x} ${point.y})${rotated?' rotate(-90)':''}`}>
    <path d="M-35-20V-33H-22M22-33H35V-20M35 17V30H22M-22 30H-35V17" className="guard-pressure-brackets"/>
    <g transform={`translate(${labelX} 40)`} className="guard-pressure-nameplate">
     <rect x="-44" y="-10" width="88" height="21" rx="5"/>
     <circle cx="-33" cy=".5" r="2.5"/>
     <text x="4" y="5" textAnchor="middle">{t('guard.pressure.core')}</text>
    </g>
   </g>
   {engaged&&target?<g transform={`translate(${target.x} ${target.y})${rotated?' rotate(-90)':''}`} className="guard-pressure-target">
    <circle r="44" className="guard-pressure-dial-track"/>
    <circle r="44" pathLength="100" strokeDasharray={`${remaining*100} 100`} transform="rotate(-90)" className="guard-pressure-dial" data-pressure-remaining={p.remainingTicks}/>
    <path d="M-36-23V-36H-23M23-36H36V-23M36 23V36H23M-23 36H-36V23" className="guard-pressure-target-corners"/>
    <g transform="translate(37 -39)" className="guard-pressure-time">
     <rect x="-18" y="-13" width="36" height="26" rx="6"/>
     <text y="7" textAnchor="middle">{seconds}<tspan fontSize="12">s</tspan></text>
    </g>
   </g>:null}
  </g>;
 })}</g>;
}
