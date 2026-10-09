import type {Hazard,PlayerStats} from '../domain/patrol-survivors';
import type {TerrainObject} from '../domain/survivors-terrain';
import {terrainHit} from './survivors-terrain';

export type FieldPoint={x:number;y:number};
export interface StaleRouteState {
  readonly points:readonly [FieldPoint,FieldPoint,FieldPoint];
  readonly oldMark:FieldPoint;
  verified:number;
}
const PADDING=64,RADIUS=19,STEP=126;
function legal(point:FieldPoint,terrain:readonly TerrainObject[]):boolean {
 return point.x>=PADDING&&point.x<=1400-PADDING&&point.y>=PADDING&&point.y<=900-PADDING&&!terrainHit(terrain,point,point,RADIUS);
}
/** Existing real collision test determines reachable verification nodes, not UI guesses. */
export function createStaleRoute(player:FieldPoint,boss:FieldPoint,terrain:readonly TerrainObject[]):StaleRouteState|null {
 const nodes:FieldPoint[]=[];
 let from:FieldPoint={x:player.x,y:player.y};
 const bearings=[-Math.PI/4,Math.PI/4,Math.PI*3/4,-Math.PI*3/4,0,Math.PI/2,Math.PI,-Math.PI/2];
 for(let step=0;step<3;step++){
  let found:FieldPoint|undefined;
  for(let i=0;i<bearings.length;i++){
   const angle=bearings[(step*3+i)%bearings.length]!;
   const target={x:Math.round(from.x+Math.cos(angle)*STEP),y:Math.round(from.y+Math.sin(angle)*STEP)};
   if(!legal(target,terrain)||terrainHit(terrain,from,target,RADIUS))continue;
   if(Math.hypot(target.x-boss.x,target.y-boss.y)<80)continue;
   if(nodes.some(p=>Math.hypot(p.x-target.x,p.y-target.y)<70))continue;
   found=target;break;
  }
  if(!found)return null;
  nodes.push(found);from=found;
 }
 // The old mark is a visual reference marked 'RECHECK', not a false collision or lethal trap.
 const oldMark={x:Math.max(PADDING,Math.min(1400-PADDING,boss.x+110)),y:Math.max(PADDING,Math.min(900-PADDING,boss.y+45))};
 return {points:nodes as unknown as [FieldPoint,FieldPoint,FieldPoint],oldMark,verified:0};
}

/** Three physical checkpoint visits open the same 4.5-second boss burst as the content contract. */
export function tickStaleRoute(h:Hazard,player:PlayerStats,terrain:readonly TerrainObject[]):boolean {
 const p=h.bossGameplay;
 if(p?.patternId!=='STALE_ROUTE'||p.combatPhase!=='pattern')return false;
 if(!p.staleRoute) {
  const route=createStaleRoute(player,h,terrain);
  if(!route)return false; // Don't invent success or place nodes in solid walls.
  p.staleRoute=route;
 }
 h.vx=0;h.vy=0;
 if(h.motion){h.motion.phase='cooldown';h.motion.timer=.15;}
 const route=p.staleRoute,target=route.points[route.verified];
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
