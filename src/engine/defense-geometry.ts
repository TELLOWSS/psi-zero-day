import type {DefenseContent,DefenseEnemyState,DefensePoint,DefenseRunState,DefenseTowerState} from '../domain/defense';
export function defensePathLength(path:readonly (readonly [number,number])[]){let total=0;for(let i=1;i<path.length;i++)total+=Math.hypot(path[i]![0]-path[i-1]![0],path[i]![1]-path[i-1]![1]);return total;}
export function defensePositionAtDistance(path:readonly (readonly [number,number])[],distance:number):DefensePoint{
 let remaining=Math.max(0,distance);for(let i=1;i<path.length;i++){const a=path[i-1]!,b=path[i]!,length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(remaining<=length||i===path.length-1){const t=length===0?0:Math.min(1,remaining/length);return {x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t};}remaining-=length;}const last=path.at(-1)!;return {x:last[0],y:last[1]};
}
export function defenseRoutes(content:DefenseContent,state?:Pick<DefenseRunState,'mapPhase'>){return state?.mapPhase==='SHIFTED'&&content.map.transition?content.map.transition.routes:content.map.routes??[{id:'main',path:content.map.path}];}
export function defenseEnemyPath(content:DefenseContent,enemy:Pick<DefenseEnemyState,'routeId'>,state?:Pick<DefenseRunState,'mapPhase'>){const routes=defenseRoutes(content,state);return routes.find(r=>r.id===(enemy.routeId??routes[0]!.id))?.path??routes[0]!.path;}
export function defenseEnemyPosition(content:DefenseContent,enemy:Pick<DefenseEnemyState,'routeId'|'distance'>,state?:Pick<DefenseRunState,'mapPhase'>){return defensePositionAtDistance(defenseEnemyPath(content,enemy,state),enemy.distance);}
export function defenseTowerPoint(content:DefenseContent,tower:Pick<DefenseTowerState,'padId'>){const pad=content.map.pads.find(p=>p.id===tower.padId);if(!pad)throw Error('Unknown pad');return {x:pad.x,y:pad.y};}
export function defenseDistanceSquared(a:DefensePoint,b:DefensePoint){return (a.x-b.x)**2+(a.y-b.y)**2;}
export function defenseSegmentDistance(point:DefensePoint,a:DefensePoint,b:DefensePoint){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/n)):0;return Math.hypot(point.x-a.x-dx*t,point.y-a.y-dy*t);}
function nearestDistance(path:readonly (readonly [number,number])[],point:DefensePoint){let best=Infinity,distance=0;const length=defensePathLength(path);for(let d=0;d<=length;d+=10){const at=defensePositionAtDistance(path,d),n=defenseDistanceSquared(point,at);if(n<best){best=n;distance=d;}}return distance;}
export function defenseObservationPoints(content:DefenseContent,state:DefenseRunState,tower:DefenseTowerState){
 const routes=defenseRoutes(content,state),origin=defenseTowerPoint(content,tower),points:DefensePoint[]=[];
 for(const offset of [0,140,-140])for(const route of routes){const d=nearestDistance(route.path,origin),at=defensePositionAtDistance(route.path,d+offset);if(points.every(p=>defenseDistanceSquared(p,at)>40**2))points.push(at);if(points.length===3)return points;}
 return points;
}
export function defenseBoundary(content:DefenseContent,state:DefenseRunState,tower:DefenseTowerState){
 const origin=defenseTowerPoint(content,tower),routes=defenseRoutes(content,state),route=[...routes].sort((a,b)=>defenseDistanceSquared(defensePositionAtDistance(a.path,nearestDistance(a.path,origin)),origin)-defenseDistanceSquared(defensePositionAtDistance(b.path,nearestDistance(b.path,origin)),origin))[0]!;
 const d=nearestDistance(route.path,origin)+70,center=defensePositionAtDistance(route.path,d),before=defensePositionAtDistance(route.path,d-5),after=defensePositionAtDistance(route.path,d+5),length=Math.hypot(after.x-before.x,after.y-before.y)||1,nx=-(after.y-before.y)/length,ny=(after.x-before.x)/length;
 return {a:{x:center.x+nx*65,y:center.y+ny*65},b:{x:center.x-nx*65,y:center.y-ny*65},width:20};
}
export function defenseGuidanceContains(state:DefenseRunState,tower:DefenseTowerState,origin:DefensePoint,target:DefensePoint,baseRange:number){
 const g=state.guidance;if(!g||g.padId!==tower.padId||g.untilTick<=state.tick)return false;
 const dx=g.direction.x-origin.x,dy=g.direction.y-origin.y,tx=target.x-origin.x,ty=target.y-origin.y,length=Math.hypot(dx,dy)*Math.hypot(tx,ty);
 return defenseDistanceSquared(origin,target)<=(baseRange+g.bonus)**2&&(length===0||(dx*tx+dy*ty)/length>=Math.cos(g.halfAngle));
}
