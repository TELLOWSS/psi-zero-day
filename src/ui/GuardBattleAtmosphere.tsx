import {useEffect,useRef,useState} from 'react';
import type {DefenseCombatShot,DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseBoundary,defenseEnemyPosition,defenseObservationPoints,defenseTowerPoint} from '../engine/defense-geometry';
import {guardContactSummary,guardExitPressure} from '../app/guard-battle-feedback';
import {defenseText as t} from '../app/defense-text';

export function GuardWaveMeter({content,state}:{content:DefenseContent;state:DefenseRunState}){
 if(state.status!=='RUNNING')return null;
 const wave=content.waves.find(w=>w.id===state.waveId)!,total=wave.groups.reduce((n,g)=>n+g.count,0),spawned=state.spawnedByGroup.reduce((n,v)=>n+v,0),remaining=Math.max(0,total-spawned)+state.enemies.length;
 const pressure=guardExitPressure(content,state);
 return <div className="guard-wave-meter" data-wave-remaining={remaining} data-exit-pressure={pressure}><strong>{pressure?`${t('guard.wave.exit_pressure')} ×${pressure}`:`${t('guard.wave.current')} ${state.waveId} / ${content.waves.length}`}<small>{t('guard.wave.remaining')} {remaining}</small></strong><progress max={total} value={Math.max(0,total-remaining)} aria-label={t('guard.wave.progress')}/></div>;
}

export function GuardBattleFields({content,state,rotated=false}:{content:DefenseContent;state:DefenseRunState;rotated?:boolean}){
 const direction=state.guidance;
 return <g className="guard-spatial-fields" aria-hidden="true">
  {state.towers.map(tower=>{
   const level=content.towers.find(f=>f.id===tower.towerId)!.levels.find(l=>l.id===tower.levelId)!,origin=defenseTowerPoint(content,tower);
   if(level.ultimate==='BOUNDARY'){const line=defenseBoundary(content,state,tower);return <g key={tower.id} data-guard-field="BOUNDARY"><line x1={line.a.x} y1={line.a.y} x2={line.b.x} y2={line.b.y} stroke="#6fffd6" strokeWidth={line.width*2} opacity=".12"/><line x1={line.a.x} y1={line.a.y} x2={line.b.x} y2={line.b.y} className="guard-boundary-core"/>{[line.a,line.b].map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="6" className="guard-boundary-anchor"/>)}</g>;}
   if(level.ultimate==='OBSERVATION')return <g key={tower.id} data-guard-field="OBSERVATION">{defenseObservationPoints(content,state,tower).map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="110" className="guard-observation-radius"/><path d={`M${p.x-8} ${p.y}h16M${p.x} ${p.y-8}v16`} className="guard-observation-node"/></g>)}</g>;
   if(level.ultimate==='ANALYSIS'){const target=state.enemies.find(e=>e.id===tower.analysisTargetId);if(!target||!(tower.analysisTicks??0))return null;const p=defenseEnemyPosition(content,target,state);return <g key={tower.id} data-guard-field="ANALYSIS" transform={`translate(${p.x} ${p.y})`}><path d="M-24-10V-24H-10M10-24H24V-10M24 10V24H10M-10 24H-24V10" className="guard-analysis-bracket"/><circle r="29" className="guard-analysis-meter" pathLength="80" strokeDasharray={`${tower.analysisTicks??0} 80`}/></g>;}
   if(level.ultimate==='VOLLEY')return <g key={tower.id} transform={`translate(${origin.x} ${origin.y+32})${rotated?' rotate(-90)':''}`} data-guard-charge={tower.charge??0}>{[0,1,2,3].map(i=><rect key={i} x={-20+i*11} y="-3" width="8" height="5" rx="1" fill={i<(tower.charge??0)?'#ffe29a':'#334a50'}/>)}</g>;
   return null;
  })}
  {direction&&direction.untilTick>state.tick?(()=>{const tower=state.towers.find(t=>t.padId===direction.padId);if(!tower)return null;const p=defenseTowerPoint(content,tower),level=content.towers.find(f=>f.id===tower.towerId)!.levels.find(l=>l.id===tower.levelId)!,angle=Math.atan2(direction.direction.y-p.y,direction.direction.x-p.x),radius=level.range+direction.bonus,a=angle-direction.halfAngle,b=angle+direction.halfAngle;return <path data-guard-field="GUIDANCE" d={`M${p.x} ${p.y}L${p.x+Math.cos(a)*radius} ${p.y+Math.sin(a)*radius}A${radius} ${radius} 0 0 1 ${p.x+Math.cos(b)*radius} ${p.y+Math.sin(b)*radius}Z`} className="guard-guidance-cone"/>;})():null}
  {state.pendingAttacks?.filter(a=>a.kind!=='VOLLEY').map(a=><g key={a.id} data-guard-field={a.kind}><circle cx={a.center.x} cy={a.center.y} r={a.kind==='WAVE'?Math.max(1,a.progressRadius):a.level.splashRadius} className={a.kind==='WAVE'?'guard-traveling-front':'guard-delayed-zone'}/>{a.kind==='DELAY'?<g transform={`translate(${a.center.x} ${a.center.y})${rotated?' rotate(-90)':''}`}><path d="M-13 0H13M0-13V13" className="guard-target-lock"/><text y="-19" className="guard-field-label" textAnchor="middle">{((a.dueTick-state.tick)*content.tickMs/1000).toFixed(1)}s</text></g>:null}</g>)}
 </g>;
}

export function GuardEvolutionFX({content,state,rotated=false}:{content:DefenseContent;state:DefenseRunState;rotated?:boolean}){
 const previous=useRef<DefenseRunState|null>(null),[ids,setIds]=useState<readonly string[]>([]);
 useEffect(()=>{const before=previous.current;previous.current=state;if(!before||before.runId!==state.runId)return;
  const changed=state.towers.filter(t=>before.towers.some(old=>old.id===t.id&&old.levelId!==t.levelId)).map(t=>t.id);
  if(changed.length)setIds(changed);
 },[state]);
 useEffect(()=>{if(!ids.length)return;const timer=window.setTimeout(()=>setIds([]),850);return()=>window.clearTimeout(timer);},[ids]);
 return <g className="guard-evolution-fx" aria-hidden="true">{state.towers.filter(t=>ids.includes(t.id)).map(tower=>{const p=defenseTowerPoint(content,tower);return <g key={tower.id+':'+tower.levelId} transform={`translate(${p.x} ${p.y})${rotated?' rotate(-90)':''}`}><ellipse rx="43" ry="15" className="guard-evolution-ring"/><path d="M-30 8V-38M30 8V-38" className="guard-evolution-rise"/><text y="-63" textAnchor="middle" className="guard-evolution-label">{tower.levelId} · {t('guard.evolution.applied')}</text></g>;})}</g>;
}

export function GuardBattleFeedback({state,shots}:{state:DefenseRunState;shots:readonly DefenseCombatShot[]}){
 const [message,setMessage]=useState<{id:string;text:string;tier:string}|null>(null),seen=useRef(''),previous=useRef<DefenseRunState|null>(null),last=useRef(-Infinity);
 useEffect(()=>{const before=previous.current;previous.current=state;if(before?.runId!==state.runId){setMessage(null);last.current=-Infinity;}
  if(state.paused||document.hidden){setMessage(null);return;}
  if(before&&state.completedWaves>before.completedWaves&&state.status==='INTERMISSION'){
   const wave=state.tacticalStats?.waves.at(-1);setMessage({id:`wave:${state.completedWaves}`,text:t(wave?.leaks===0?'guard.feedback.clean_wave':'guard.feedback.wave_clear'),tier:'WAVE'});return;
  }
  const key=shots.map(s=>s.id).join('|');if(!key||key===seen.current)return;seen.current=key;
  const summary=guardContactSummary(shots);if(!summary.bossResolved&&summary.resolved<3)return;
  const now=performance.now();if(now-last.current<800&&!summary.bossResolved)return;last.current=now;
  setMessage({id:key,text:summary.bossResolved?t('guard.feedback.core_break'):`${t(summary.tier==='SURGE'?'guard.feedback.surge':'guard.feedback.break')} ×${summary.resolved}`,tier:summary.tier});
 },[state,shots]);
 useEffect(()=>{if(!message)return;const timer=window.setTimeout(()=>setMessage(null),1400);return()=>window.clearTimeout(timer);},[message]);
 useEffect(()=>{const hide=()=>{if(document.hidden)setMessage(null);};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 return <div className="guard-battle-feedback" role="status" aria-live="polite">{message?<span key={message.id} data-feedback-tier={message.tier}>{message.text}</span>:null}</div>;
}
