import {useId} from 'react';
import type {DefenseContent,DefenseTowerState} from '../domain/defense';
import calibration from '../../content/defense/guard-combat-presentation-v1.json';

/** Light and mechanical feedback use existing world coordinates; this layer owns no rules. */
export function GuardWorldLighting({running}:{running:boolean}){
 const id=useId();
 return <g className={`guard-world-lighting${running?' is-live':''}`} aria-hidden="true">
  <defs>
   <radialGradient id={id+'-pool'} cx="48%" cy="43%" r="68%"><stop offset="0" stopColor="#a5d9dc" stopOpacity=".035"/><stop offset=".66" stopColor="#152b32" stopOpacity="0"/><stop offset="1" stopColor="#051014" stopOpacity=".38"/></radialGradient>
   <linearGradient id={id+'-warm'} x1="0" y1="0" x2=".12" y2="1"><stop offset="0" stopColor="#ffc582" stopOpacity=".11"/><stop offset=".30" stopColor="#ffc582" stopOpacity="0"/><stop offset=".78" stopColor="#fff1cc" stopOpacity="0"/><stop offset="1" stopColor="#ffe0a4" stopOpacity=".06"/></linearGradient>
  </defs>
  <rect width="1000" height="600" fill={`url(#${id}-pool)`}/>
  <rect width="1000" height="600" fill={`url(#${id}-warm)`} className="guard-worklight-breath"/>
 </g>;
}

export function GuardEquipmentRig({content,tower}:{content:DefenseContent;tower:DefenseTowerState}){
 const level=content.towers.find(t=>t.id===tower.towerId)!.levels.find(l=>l.id===tower.levelId)!;
 const charge=1-Math.min(1,tower.attackCooldown/level.intervalTicks);
 const emitters=(calibration.origins as Record<string,number[][]>)[`${tower.towerId}.${tower.levelId}`]??[];
 return <g className={`guard-equipment-rig is-${tower.towerId.toLowerCase()}`} aria-hidden="true">
  <ellipse cy="20" rx="30" ry="8" className="guard-equipment-plinth"/>
  {emitters.map(([x,y],i)=><g key={i} transform={`translate(${-54+x!*108} ${-77+y!*108})`}><circle r="4" className="guard-aperture-halo" opacity={.08+charge*.18}/><circle r="1.3" className="guard-aperture-core" opacity={.25+charge*.4}/></g>)}
 </g>;
}

export function GuardRiskAura({enemyId,locked,armored}:{enemyId:string;locked:boolean;armored:boolean}){
 return <g className={`guard-risk-aura is-${enemyId.toLowerCase()}${locked?' is-locked':''}`} aria-hidden="true">
  <ellipse cy="10" rx={enemyId==='BOSS'?38:22} ry={enemyId==='BOSS'?12:7} className="guard-risk-contact"/>
  {enemyId==='BOSS'?<><ellipse cy="9" rx="46" ry="17" className={`guard-boss-circuit${armored?' is-armored':''}`}/><path d="M-38 1L-45-4M38 1L45-4M-22 22L-25 30M22 22L25 30" className="guard-boss-supportlight"/></>:null}
  {enemyId==='SWARM'?<ellipse cy="5" rx="24" ry="10" className="guard-swarm-orbit"/>:null}
  {locked?<path d="M-20-14V-22H-12M12-22H20V-14M20 12V20H12M-12 20H-20V12" className="guard-lock-state"/>:null}
 </g>;
}
