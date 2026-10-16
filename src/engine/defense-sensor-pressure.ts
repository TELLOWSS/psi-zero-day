import type {DefenseContent,DefenseRunState,DefenseTowerState,DefenseWaveDefinition,DefenseSpawnGroup} from '../domain/defense';
import {defenseEnemyPath,defenseEnemyPosition,defenseSegmentDistance,defenseTowerPoint} from './defense-geometry';

export function defensePressureCore(content:DefenseContent,waveId:number,group:number,index:number,enabled:boolean):boolean{
 return enabled&&!!content.sensorPressure?.waves.includes(waveId)&&group===0&&index===0;
}
export function defensePressureWaveGroups(content:DefenseContent,wave:DefenseWaveDefinition,enabled:boolean):readonly (DefenseSpawnGroup&{pressureCore?:true})[]{
 return wave.groups.flatMap((g,i)=>{
  if(!defensePressureCore(content,wave.id,i,0,enabled))return [g];
  return [{...g,enemy:'ARMORED' as const,count:1,pressureCore:true as const},...(g.count>1?[{...g,count:g.count-1,startTick:g.startTick+g.intervalTicks}]:[])];
 });
}

/** A surviving, active core blocks only its locked tower's next reveal pulses. */
export function defenseSensorBlocked(state:DefenseRunState,tower:DefenseTowerState):boolean{
 if(!state.sensorPressureEnabled)return false;
 return state.enemies.some(e=>e.hp>0&&e.sensorPressure?.phase==='ACTIVE'&&e.sensorPressure.targetTowerId===tower.id&&e.sensorPressure.targetPadId===tower.padId);
}
export function updateDefenseSensorPressure(state:DefenseRunState,content:DefenseContent):DefenseRunState{
 const rule=content.sensorPressure;if(!rule||!state.sensorPressureEnabled)return state;
 const frozen=state.tick<state.freezeMovementUntilTick;
 let warnings=0,interruptions=0;
 const enemies=state.enemies.map(enemy=>{
  const p=enemy.sensorPressure;if(!p||p.phase==='SPENT'||enemy.hp<=0)return enemy;
  if(p.phase==='SEEK'){
   const route=defenseEnemyPath(content,enemy,state),at=defenseEnemyPosition(content,enemy,state);
   const candidates=state.towers.filter(t=>t.towerId==='SENSOR').filter(t=>{
    const level=content.towers.find(d=>d.id===t.towerId)!.levels.find(l=>l.id===t.levelId)!,point=defenseTowerPoint(content,t);
    return route.some((b,i)=>i>0&&defenseSegmentDistance(point,{x:route[i-1]![0],y:route[i-1]![1]},{x:b[0],y:b[1]})<=level.revealRadius);
   }).sort((a,b)=>{const pa=defenseTowerPoint(content,a),pb=defenseTowerPoint(content,b);return Math.hypot(pa.x-at.x,pa.y-at.y)-Math.hypot(pb.x-at.x,pb.y-at.y)||a.id.localeCompare(b.id);});
   const target=candidates[0];if(target)warnings++;return target?{...enemy,sensorPressure:{phase:'WARNING' as const,remainingTicks:rule.warningTicks,targetTowerId:target.id,targetPadId:target.padId}}:enemy;
  }
  const target=state.towers.find(t=>t.id===p.targetTowerId&&t.padId===p.targetPadId&&t.towerId==='SENSOR');
  if(!target)return {...enemy,sensorPressure:{...p,phase:'SPENT' as const,remainingTicks:0}};
  if(frozen)return enemy;
  const remainingTicks=Math.max(0,p.remainingTicks-1);
  if(remainingTicks)return {...enemy,sensorPressure:{...p,remainingTicks}};
  if(p.phase==='WARNING')interruptions++;
  return {...enemy,sensorPressure:{...p,phase:p.phase==='WARNING'?'ACTIVE' as const:'SPENT' as const,remainingTicks:p.phase==='WARNING'?rule.activeTicks:0}};
 });
 return {...state,enemies,...(state.tacticalStats&&(warnings||interruptions)?{tacticalStats:{...state.tacticalStats,sensorWarnings:(state.tacticalStats.sensorWarnings??0)+warnings,sensorInterruptions:(state.tacticalStats.sensorInterruptions??0)+interruptions}}:{})};
}
