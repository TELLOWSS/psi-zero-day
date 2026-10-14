import {safetyWalkway,type ResolvedWorker,type WorkerRoutePoint} from '../domain/survivors-safety-walkway';
import type {StageHazardObject} from '../domain/patrol-survivors';
import type {TerrainObject} from '../domain/survivors-terrain';
import {terrainContains,terrainFreePoint,terrainHit,terrainMove,terrainWaypoint} from './survivors-terrain';
const RADIUS=18,SPEED=100;
/** Interactive prop radii describe their effect zones, not their solid bases. */
export function workerRouteTerrain(terrain:readonly TerrainObject[],props:readonly StageHazardObject[]):TerrainObject[]{
 return [...terrain,...props.filter(p=>p.hp>0&&p.state!=='destroyed'&&['floodlight_tower','electric_transformer','explosive_barrel'].includes(p.type)).map(p=>{
  const size=p.type==='electric_transformer'?60:40;
  return {id:'worker-prop:'+p.id,kind:'cover' as const,x:p.x-size/2,y:p.y-size/2,width:size,height:size,hp:1,maxHp:1};
 })];
}
const distance=(a:WorkerRoutePoint,b:WorkerRoutePoint)=>Math.hypot(a.x-b.x,a.y-b.y);
function entryY(y:number,terrain:readonly TerrainObject[],width:number,height:number){
 const candidates=[y,...terrain.flatMap(o=>[o.y-RADIUS-3,o.y+o.height+RADIUS+3])];
 return candidates.filter(value=>value>=RADIUS&&value<=height-RADIUS&&!terrain.some(o=>terrainContains(o,{x:width/2,y:value},RADIUS))).sort((a,b)=>Math.abs(a-y)-Math.abs(b-y))[0]??y;
}
function zoneHit(a:WorkerRoutePoint,b:WorkerRoutePoint,zone:StageHazardObject){
 const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((zone.x-a.x)*dx+(zone.y-a.y)*dy)/length)):0;
 return Math.hypot(a.x+t*dx-zone.x,a.y+t*dy-zone.y)<zone.radius+RADIUS;
}
export function createResolvedWorker(id:string,x:number,y:number,terrain:readonly TerrainObject[],width:number,height:number):ResolvedWorker{
 const p=terrainFreePoint(terrain,{x:Math.max(RADIUS,Math.min(width-RADIUS,x)),y:Math.max(RADIUS,Math.min(height-RADIUS,y))},RADIUS);
 return {id,...p,remaining:1,route:{exit:p.y<height/2?'north':'south',phase:'approach',entryY:entryY(p.y,terrain,width,height),waiting:false}};
}
/** True only after reaching the chosen gate. No timer despawn or second reward. */
export function updateResolvedWorker(worker:ResolvedWorker,dt:number,terrain:readonly TerrainObject[],zones:readonly StageHazardObject[],width:number,height:number):boolean{
 if(!Number.isFinite(dt)||dt<=0)return false;
 worker.route??={exit:worker.y<height/2?'north':'south',phase:'approach',entryY:entryY(worker.y,terrain,width,height),waiting:false};
 const route=worker.route,walkway=safetyWalkway(width,height);route.waiting=false;
 const activeZones=zones.filter(z=>z.type==='crane_drop_zone'&&(z.state==='warning'||z.state==='active'));
 let budget=dt*SPEED;
 for(let step=0;step<12&&budget>0;step++){
  const inside=activeZones.find(z=>distance(worker,z)<z.radius+RADIUS);
  if(inside){
   // Leave a newly warned footprint in place, without teleporting or crossing it.
   const dy=worker.y<inside.y?-1:worker.y>inside.y?1:route.exit==='north'?-1:1;
   const next=terrainMove(terrain,worker,{x:worker.x,y:worker.y+dy*budget},RADIUS);
   if(distance(next,inside)>distance(worker,inside)){worker.x=next.x;worker.y=next.y;route.waypoint=undefined;}
   route.waiting=true;break;
  }
  const target=route.phase==='approach'?{x:walkway.centerX,y:route.entryY}:{x:walkway.centerX,y:route.exit==='north'?walkway.northY:walkway.southY};
  if(distance(worker,target)<.01){
   if(route.phase==='corridor')return true;
   route.phase='corridor';route.waypoint=undefined;continue;
  }
  if(!route.waypoint||terrainHit(terrain,worker,route.waypoint,RADIUS))route.waypoint=terrainWaypoint(terrain,worker,target,RADIUS);
  const goal=route.waypoint,length=distance(worker,goal);
  if(length<.01){route.waypoint=undefined;route.waiting=true;break;}
  const travel=Math.min(length,budget),next={x:worker.x+(goal.x-worker.x)*travel/length,y:worker.y+(goal.y-worker.y)*travel/length};
  if(activeZones.some(z=>zoneHit(worker,next,z))){route.waiting=true;break;}
  const moved=terrainMove(terrain,worker,next,RADIUS),actual=distance(worker,moved);
  worker.x=moved.x;worker.y=moved.y;budget-=travel;
  if(actual<travel-.01){route.waypoint=undefined;route.waiting=true;break;}
  if(travel>=length-.01)route.waypoint=undefined;
 }
 worker.remaining=Math.max(.1,1-Math.max(0,-worker.y,worker.y-height)/80);
 return route.phase==='corridor'&&(route.exit==='north'?worker.y<=walkway.northY+.01:worker.y>=walkway.southY-.01);
}
