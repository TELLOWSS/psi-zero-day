import {defensePressureWaveGroups} from '../engine/defense-sensor-pressure';
import type {DefenseContent,DefenseWaveDefinition} from '../domain/defense';
export function guardWaveIntel(content:DefenseContent,wave:DefenseWaveDefinition,pressureEnabled=true){
 const groups=defensePressureWaveGroups(content,wave,pressureEnabled).map((group,index)=>{
  const enemy=content.enemies.find(e=>e.id===group.enemy)!;
  return {index,cores:group.pressureCore?1:0,routeId:group.routeId??content.map.routes?.[0]?.id??'main',enemy:group.enemy,count:group.count,start:group.startTick*content.tickMs/1000,end:(group.startTick+(group.count-1)*group.intervalTicks)*content.tickMs/1000,
   armor:Math.round(enemy.armor*100),hidden:enemy.hidden};
 });
 return {waveId:wave.id,groups,duration:Math.max(1,...groups.map(g=>g.end)),count:groups.reduce((n,g)=>n+g.count,0)};
}
