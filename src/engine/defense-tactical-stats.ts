import type {DefenseCombatShot,DefenseContent,DefenseRunState} from '../domain/defense';

export function withDefenseTacticalStats(state:DefenseRunState,content:DefenseContent):DefenseRunState{
 if(!content.combatReportEnabled)return state;
 if(state.tacticalStats)return state.tacticalStats.tickMs?state:{...state,tacticalStats:{...state.tacticalStats,tickMs:content.tickMs,detailTrackedFromTick:state.tick}};
 return {...state,tacticalStats:{tickMs:content.tickMs,detailTrackedFromTick:state.tick,trackedFromTick:state.tick,initialLeaks:Object.values(state.leakedByEnemy).reduce((n,x)=>n+(x??0),0),initialShield:state.shield,damage:0,resolved:0,shots:0,supportUses:0,eStopUses:0,peakSignals:state.enemies.length,byFamily:{},bestClear:null,waves:[]}};
}
export function recordDefenseCombat(state:DefenseRunState,shots:readonly DefenseCombatShot[]):DefenseRunState{
 if(!state.tacticalStats||!shots.length)return state;
 const before=state.tacticalStats;let stats={...before,byFamily:{...before.byFamily},byLevel:{...before.byLevel}};
 for(const shot of shots){
  const damage=shot.targets.reduce((n,t)=>n+t.damage,0),resolved=shot.targets.filter(t=>t.resolved).length;
  const family=stats.byFamily[shot.towerId]??{damage:0,resolved:0,shots:0};
  const count=shot.phase==='IMPACT'?0:1;
  const key=shot.towerId+':'+shot.levelId,level=stats.byLevel[key]??{damage:0,resolved:0,shots:0};
  stats.byLevel[key]={damage:level.damage+damage,resolved:level.resolved+resolved,shots:level.shots+count};
  stats.byFamily[shot.towerId]={damage:family.damage+damage,resolved:family.resolved+resolved,shots:family.shots+count};
  stats={...stats,damage:stats.damage+damage,resolved:stats.resolved+resolved,shots:stats.shots+count,
   bestClear:resolved>(stats.bestClear?.count??0)?{count:resolved,towerId:shot.towerId,levelId:shot.levelId,padId:shot.padId,waveId:state.waveId}:stats.bestClear};
 }
 const enemies=state.enemies.map(enemy=>{
  if(enemy.firstContact)return enemy;
  for(const shot of shots){const target=shot.targets.find(target=>target.id===enemy.id&&target.damage>0);
   if(target)return {...enemy,firstContact:{padId:shot.padId,tick:state.tick,point:target.point}};
  }
  return enemy;
 });
 return {...state,enemies,tacticalStats:stats};
}
export function closeDefenseTacticalWave(state:DefenseRunState):DefenseRunState{
 const stats=state.tacticalStats;if(!stats||stats.waves.some(w=>w.waveId===state.waveId))return state;
 const totalLeaks=Object.values(state.leakedByEnemy).reduce((n,x)=>n+(x??0),0);
 const sum=(key:'resolved'|'leaks'|'shieldLost')=>stats.waves.reduce((n,w)=>n+w[key],0);
 const wave={waveId:state.waveId,resolved:Math.max(0,stats.resolved-sum('resolved')),leaks:Math.max(0,totalLeaks-stats.initialLeaks-sum('leaks')),shieldLost:Math.max(0,stats.initialShield-state.shield-sum('shieldLost'))};
 return {...state,tacticalStats:{...stats,waves:[...stats.waves,wave]}};
}
