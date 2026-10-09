import type {Hazard,PlayerStats} from '../domain/patrol-survivors';
import type {TerrainObject} from '../domain/survivors-terrain';
import {terrainHit} from './survivors-terrain';

export type FieldPoint={x:number;y:number};
export interface StaleRouteState {
  readonly points:readonly [FieldPoint,FieldPoint,FieldPoint];
  readonly oldMark:FieldPoint;
  readonly oldMarkEnabled:boolean;
  verified:number;
  misreads:number;
  warningRemaining:number;
  oldRouteArmed:boolean;
}
const PADDING=64,RADIUS=19,STEP=126;
function legal(point:FieldPoint,terrain:readonly TerrainObject[]):boolean {
 return point.x>=PADDING&&point.x<=1400-PADDING&&point.y>=PADDING&&point.y<=900-PADDING&&!terrainHit(terrain,point,point,RADIUS);
}
/** Existing real collision test determines reachable verification nodes, not UI guesses. */
export function createStaleRoute(player:FieldPoint,boss:FieldPoint,terrain:readonly TerrainObject[]):StaleRouteState|null {
 // A bounded depth-three search, not a one-way greedy chain. Without
 // backtracking, a legal first waypoint near a wall may lead to a dead end.
 // Long strides are preferred, with one short-stride fallback for tight bays.
 const bearings=[-Math.PI/4,Math.PI/4,Math.PI*3/4,-Math.PI*3/4,0,Math.PI/2,Math.PI,-Math.PI/2];
 const startPoint={x:player.x,y:player.y};
 const search=(from:FieldPoint,nodes:FieldPoint[]):FieldPoint[]|null=>{
  if(nodes.length===3)return nodes;
  const step=nodes.length;
  for(const distance of [STEP,84]){
   for(let i=0;i<bearings.length;i++){
    const angle=bearings[(step*3+i)%bearings.length]!;
    const target={x:Math.round(from.x+Math.cos(angle)*distance),y:Math.round(from.y+Math.sin(angle)*distance)};
    if(!legal(target,terrain)||terrainHit(terrain,from,target,RADIUS))continue;
    if(Math.hypot(target.x-boss.x,target.y-boss.y)<80)continue;
    if(nodes.some(point=>Math.hypot(point.x-target.x,point.y-target.y)<70))continue;
    if(Math.hypot(target.x-startPoint.x,target.y-startPoint.y)<70)continue;
    const result=search(target,[...nodes,target]);
    if(result)return result;
   }
  }
  return null;
 };
 const nodes=search(startPoint,[]);
 if(!nodes)return null;
 // Unlike the three safe checkpoints, the obsolete sign denotes a real
 // blocked lane. Place it well clear of EVERY mandatory segment so a careful
 // player can always reach the correct route without touching this penalty.
 const distanceToSegment=(p:FieldPoint,a:FieldPoint,b:FieldPoint)=>{
  const dx=b.x-a.x,dy=b.y-a.y,denom=dx*dx+dy*dy;
  const t=denom>0?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/denom)):0;
  return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));
 };
 const candidates=[0,Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,Math.PI,Math.PI*3/4,-Math.PI*3/4]
  .flatMap(a=>[122,158].map(d=>({x:Math.round(boss.x+Math.cos(a)*d),y:Math.round(boss.y+Math.sin(a)*d)})));
 const chain=[startPoint,...nodes];
 const oldMark=candidates.find(mark=>legal(mark,terrain)
  &&Math.hypot(mark.x-startPoint.x,mark.y-startPoint.y)>55
  &&chain.slice(1).every((node,i)=>distanceToSegment(mark,chain[i]!,node)>61));
 // An obstructed map variant may have no fair obsolete lane: omit the penalty
 // rather than materializing an unavoidable or unreachable trap.
 const oldMarkEnabled=Boolean(oldMark);
 return {points:nodes as [FieldPoint,FieldPoint,FieldPoint],
   oldMark:oldMark??{x:boss.x,y:boss.y},oldMarkEnabled,
   verified:0,misreads:0,warningRemaining:0,oldRouteArmed:true};
}

/** Three physical checkpoint visits open the same 4.5-second boss burst as the content contract. */
export function tickStaleRoute(h:Hazard,player:PlayerStats,terrain:readonly TerrainObject[],dt=1/60):boolean {
 const p=h.bossGameplay;
 if(p?.patternId!=='STALE_ROUTE'||p.combatPhase!=='pattern')return false;
 if(!p.staleRoute) {
  const route=createStaleRoute(player,h,terrain);
  if(!route)return false; // Don't invent success or place nodes in solid walls.
  p.staleRoute=route;
 }
 h.vx=0;h.vy=0;
 if(h.motion){h.motion.phase='cooldown';h.motion.timer=.15;}
 const route=p.staleRoute;
 route.warningRemaining=Math.max(0,route.warningRemaining-Math.max(0,dt));
 if(route.oldMarkEnabled){
  const separation=Math.hypot(player.x-route.oldMark.x,player.y-route.oldMark.y);
  if(separation>56)route.oldRouteArmed=true;
  if(separation<=35&&route.oldRouteArmed){
   route.oldRouteArmed=false;
   route.misreads++;
   // Non-lethal but consequential: a wrong sign invalidates one checked point.
   // A brief 1.2 s recheck delay gives players time to read and recover.
   route.verified=Math.max(0,route.verified-1);
   route.warningRemaining=1.2;
   return true;
  }
 }
 if(route.warningRemaining>0)return true;
 const target=route.points[route.verified];
 if(target&&Math.hypot(player.x-target.x,player.y-target.y)<=29){
  route.verified++;
  if(route.verified===3){
   p.signatureResolvedThisCycle=true;
   p.combatPhase='burst';
   p.remaining=0;
   p.burstRemaining=4.5;
  }
 }
 return true;
}
