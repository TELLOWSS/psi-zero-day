import type {DefenseCombatShot,DefenseContent,DefenseRunState} from '../domain/defense';
import {defenseEnemyPath,defensePathLength} from '../engine/defense-geometry';

export function guardExitPressure(content:DefenseContent,state:DefenseRunState){
 return state.status==='RUNNING'?state.enemies.filter(e=>e.hp>0&&defensePathLength(defenseEnemyPath(content,e,state))-e.distance<=180).length:0;
}

/** Presentation only: no combo multiplier, free damage or combat-state mutation. */
export function guardContactSummary(shots:readonly DefenseCombatShot[]){
 const contacts=new Map<string,DefenseCombatShot['targets'][number]>(),seen=new Set<string>();
 for(const shot of shots){if(seen.has(shot.id)||shot.phase==='LAUNCH')continue;seen.add(shot.id);
  for(const hit of shot.targets){const prior=contacts.get(hit.id);contacts.set(hit.id,{...hit,damage:(prior?.damage??0)+hit.damage,resolved:hit.resolved||prior?.resolved===true});}
 }
 const hits=[...contacts.values()],resolved=hits.filter(h=>h.resolved).length;
 return {hits:hits.length,resolved,damage:hits.reduce((sum,h)=>sum+h.damage,0),bossResolved:hits.some(h=>h.enemyId==='BOSS'&&h.resolved),tier:resolved>=8?'SURGE':resolved>=3?'BREAK':'CONTACT'};
}

export function guardDamageLabels(shots:readonly DefenseCombatShot[]){
 // At most eight labels over all 24 groups, prioritising actual boss/core and clears.
 return shots.flatMap(shot=>shot.phase==='LAUNCH'?[]:shot.targets.map(hit=>({shotId:shot.id,hit})))
  .sort((a,b)=>Number(b.hit.enemyId==='BOSS')-Number(a.hit.enemyId==='BOSS')||Number(b.hit.resolved)-Number(a.hit.resolved)||b.hit.damage-a.hit.damage)
  .slice(0,8).map(({shotId,hit})=>`${shotId}|${hit.id}`);
}
