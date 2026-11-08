import type {OmegaFieldObstacle,OmegaFieldPoint} from './omega-protocol-field';

/** Deterministic 2D visibility graph for the four blocking field structures.
 * This guides the player around static solids. It is NOT dynamic enemy avoidance
 * and does not change the Watch combat/collision simulation.
 */
export interface OmegaFieldRoute {
 readonly next:OmegaFieldPoint;
 readonly length:number;
 readonly detour:boolean;
 readonly waypoints:readonly OmegaFieldPoint[];
}
const distance=(a:OmegaFieldPoint,b:OmegaFieldPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
const finite=(p:OmegaFieldPoint)=>Number.isFinite(p.x)&&Number.isFinite(p.y);
type Box=Readonly<{left:number;top:number;right:number;bottom:number}>;
function inside(p:OmegaFieldPoint,r:Box):boolean{
 return p.x>r.left+1e-7&&p.x<r.right-1e-7&&
  p.y>r.top+1e-7&&p.y<r.bottom-1e-7;
}
/** Segment-box overlap using closed intervals. Boundary tangency is blocked. */
function crosses(a:OmegaFieldPoint,b:OmegaFieldPoint,r:Box):boolean{
 let enter=0,leave=1;
 const axes=[
  [a.x,b.x-a.x,r.left,r.right],
  [a.y,b.y-a.y,r.top,r.bottom],
 ] as const;
 for(const [start,delta,min,max] of axes){
  if(Math.abs(delta)<1e-9){
   if(start<min||start>max)return false;
   continue;
  }
  const v1=(min-start)/delta,v2=(max-start)/delta;
  enter=Math.max(enter,Math.min(v1,v2));
  leave=Math.min(leave,Math.max(v1,v2));
  if(enter>leave)return false;
 }
 // Moving AWAY from a solid's exact edge must be allowed. Entering the
 // interior is blocked; a single endpoint tangent is not an intersection.
 return leave>enter+1e-8&&leave>0&&enter<1;
}
export function omegaFieldNextRoute(
 actor:OmegaFieldPoint,destination:OmegaFieldPoint,
 obstacles:readonly OmegaFieldObstacle[],
 width=1400,height=900,
):OmegaFieldRoute|null{
 if(!finite(actor)||!finite(destination)||!Number.isFinite(width)||
  !Number.isFinite(height)||width<=0||height<=0)return null;
 const clearance=21; // matches the existing field player collision radius
 const boxes:Box[]=obstacles.map(o=>({
  left:o.x-clearance,right:o.x+o.width+clearance,
  top:o.y-clearance,bottom:o.y+o.height+clearance,
 }));
 const valid=(p:OmegaFieldPoint)=>p.x>=22&&p.x<=width-22&&
  p.y>=22&&p.y<=height-22&&!boxes.some(b=>inside(p,b));
 if(!valid(actor)||!valid(destination))return null;
 const clear=(a:OmegaFieldPoint,b:OmegaFieldPoint)=>
  !boxes.some(box=>crosses(a,b,box));
 if(clear(actor,destination)){
  return {next:destination,length:distance(actor,destination),
   detour:false,waypoints:[destination]};
 }
 const nodes:OmegaFieldPoint[]=[actor,destination];
 // Corner candidates are 7 units OUTSIDE the expanded solids.
 for(const b of boxes)for(const x of [b.left-7,b.right+7])
  for(const y of [b.top-7,b.bottom+7]){
   const p={x,y};if(valid(p))nodes.push(p);
  }
 const size=nodes.length;
 const cost=Array<number>(size).fill(Infinity);
 const parent=Array<number>(size).fill(-1);
 const used=Array<boolean>(size).fill(false);
 cost[0]=0;
 for(let step=0;step<size;step++){
  let current=-1;
  for(let i=0;i<size;i++)if(!used[i]&&(current<0||cost[i]<cost[current]!))current=i;
  if(current<0||!Number.isFinite(cost[current]))break;
  if(current===1)break;
  used[current]=true;
  for(let candidate=1;candidate<size;candidate++){
   if(used[candidate]||candidate===current||!clear(nodes[current]!,nodes[candidate]!))continue;
   const total=cost[current]!+distance(nodes[current]!,nodes[candidate]!);
   if(total+1e-8<cost[candidate]!){
    cost[candidate]=total;parent[candidate]=current;
   }
  }
 }
 if(!Number.isFinite(cost[1]))return null;
 const backward:number[]=[];
 for(let at=1,guard=0;at!==0&&guard<=size;guard++){
  backward.push(at);at=parent[at]!;
  if(at<0)return null;
 }
 if(backward.length>size)return null;
 const waypoints=backward.reverse().map(index=>nodes[index]!);
 // The actor may be standing exactly on a generated graph corner.
 // Skip duplicate start nodes so an analog stick never receives a 0-length
 // bearing and a wayfinder never points at its own current position.
 const actionable=waypoints.filter(p=>distance(p,actor)>1e-4);
 if(!actionable.length)return null;
 return {next:actionable[0]!,length:cost[1]!,
  detour:true,waypoints:actionable};
}
