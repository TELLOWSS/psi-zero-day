import type {DefenseContent,DefenseRunState,DefenseWaveDefinition} from '../domain/defense';
import {defenseRoutes} from '../engine/defense-geometry';

/** Approximate union of installed base ranges, not a win forecast or an automatic command. */
export function guardPreparationCheck(content:DefenseContent,state:DefenseRunState,wave:DefenseWaveDefinition){
 const shifted=content.map.transition&&wave.id>=content.map.transition.beforeWave;
 const routes=defenseRoutes(content,shifted?{mapPhase:'SHIFTED'}:state);
 const installations=state.towers.flatMap(tower=>{
  const pad=content.map.pads.find(p=>p.id===tower.padId),level=content.towers.find(t=>t.id===tower.towerId)?.levels.find(l=>l.id===tower.levelId);
  return pad&&level?[{pad,level}]:[];
 });
 return routes.filter(route=>wave.groups.some(g=>(g.routeId??routes[0]?.id)===route.id)).map(route=>{
  const hidden=wave.groups.some(g=>(g.routeId??routes[0]?.id)===route.id&&content.enemies.find(e=>e.id===g.enemy)?.hidden);
  let total=0,attack=0,reveal=0;
  for(let i=1;i<route.path.length;i++){
   const a=route.path[i-1]!,b=route.path[i]!,length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(length/20)),weight=length/steps;
   for(let n=0;n<steps;n++){
    const x=a[0]+(b[0]-a[0])*(n+.5)/steps,y=a[1]+(b[1]-a[1])*(n+.5)/steps;
    total+=weight;
    if(installations.some(({pad,level})=>level.damage>0&&Math.hypot(pad.x-x,pad.y-y)<=level.range))attack+=weight;
    if(installations.some(({pad,level})=>level.revealRadius>0&&Math.hypot(pad.x-x,pad.y-y)<=level.revealRadius))reveal+=weight;
   }
  }
  return {routeId:route.id,hidden,attackPercent:Math.round(attack/Math.max(1,total)*100),revealPercent:Math.round(reveal/Math.max(1,total)*100)};
 });
}
