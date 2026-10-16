import {useEffect,useState} from 'react';
import type {DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseText as t} from '../app/defense-text';

/** Preparation-only preview. This timer never dispatches commands or starts a wave. */
export function GuardRaidBriefing({content,state}:{content:DefenseContent;state:DefenseRunState}){
 const [remaining,setRemaining]=useState(4);
 useEffect(()=>{const id=window.setInterval(()=>setRemaining(n=>Math.max(0,n-1)),1000);return()=>window.clearInterval(id);},[]);
 const transition=content.map.transition;
 if(!transition)return null;
 return <details className="guard-raid-briefing" open>
  <summary>{t('guard.raid.briefing')} · {remaining?`${remaining}s`:t('guard.raid.ready')}</summary>
  <p>{t('guard.raid.preparation')}</p>
  <svg viewBox="0 0 1000 600" role="img" aria-label={t('guard.raid.preview')} style={{width:'100%',maxHeight:220,background:'#071b27',borderRadius:12}}>
   {(content.map.routes??[{id:'main',path:content.map.path}]).map(route=><polyline key={route.id} points={route.path.map(p=>p.join(',')).join(' ')} fill="none" stroke="#94a3b8" strokeDasharray="12 12" strokeWidth={7}/>)}
   {transition.routes.map((route,i)=><g key={route.id}><polyline points={route.path.map(p=>p.join(',')).join(' ')} fill="none" stroke={i?'#fbbf24':'#67e8f9'} strokeWidth={9}/><text x={route.path[0]![0]+20} y={route.path[0]![1]-12} fill="#fff" fontSize={24}>{route.id}</text></g>)}
   {content.map.pads.map(pad=>{const tower=state.towers.find(tower=>tower.padId===pad.id),level=content.towers.find(t=>t.id===tower?.towerId)?.levels.find(l=>l.id===tower?.levelId);return <g key={pad.id}>{level?<circle cx={pad.x} cy={pad.y} r={level.range} fill="#67e8f911" stroke="#67e8f9" strokeWidth={2}/>:null}<circle cx={pad.x} cy={pad.y} r={13} fill={tower?'#fff':'#475569'}/><text x={pad.x+18} y={pad.y+8} fill="#fff" fontSize={22}>{pad.id}</text></g>;})}
  </svg>
 </details>;
}
