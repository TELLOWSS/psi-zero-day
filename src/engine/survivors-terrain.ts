import type {TerrainObject} from '../domain/survivors-terrain';
import type {PatrolStageDefinition} from '../domain/patrol-survivors';
type Point={x:number;y:number};
export function createTerrain(stage:PatrolStageDefinition):TerrainObject[] {
 const shift=(stage.stageNumber-1)%3*32;
 const objects:TerrainObject[]=[
  {id:'terrain_left',kind:'pillar',x:380,y:360+shift,width:90,height:90,hp:1,maxHp:1},
  {id:'terrain_right',kind:'pillar',x:930,y:490-shift,width:90,height:90,hp:1,maxHp:1},
  {id:'terrain_cover',kind:'cover',x:520,y:90,width:140,height:56,hp:1,maxHp:1},
  {id:'terrain_rubble',kind:'rubble',x:760,y:660,width:110,height:64,hp:80,maxHp:80},
 ];
 // Authored targets and the central start/extraction corridor always remain clear.
 const placed:TerrainObject[]=[];
 for(const object of objects){
  const candidates=[object,...[120,260,420,920,1100,1200].flatMap(x=>[90,290,490,720].map(y=>({...object,x,y})))];
  const selected=candidates.find(o=>
   !stage.hazards.some(h=>Math.hypot(h.x-(o.x+o.width/2),h.y-(o.y+o.height/2))<Math.min(32,h.radius)+Math.hypot(o.width,o.height)/2+20)&&
   !placed.some(p=>o.x<p.x+p.width+50&&o.x+o.width+50>p.x&&o.y<p.y+p.height+50&&o.y+o.height+50>p.y));
  if(selected)placed.push(selected);
 }
 return placed;
}
export function terrainContains(o:TerrainObject,p:Point,radius=0):boolean {
 return o.hp>0&&p.x>o.x-radius&&p.x<o.x+o.width+radius&&p.y>o.y-radius&&p.y<o.y+o.height+radius;
}
/** Segment against an expanded footprint; swept checks also prevent dash tunnelling. */
export function terrainHit(objects:readonly TerrainObject[],a:Point,b:Point,radius=0):{object:TerrainObject;t:number}|undefined {
 let best:{object:TerrainObject;t:number}|undefined;
 for(const o of objects){
  if(o.hp<=0)continue;
  let lo=0,hi=1;
  for(const axis of ['x','y'] as const){
   const min=o[axis]-radius,max=o[axis]+(axis==='x'?o.width:o.height)+radius,d=b[axis]-a[axis];
   if(Math.abs(d)<1e-9){if(a[axis]<=min||a[axis]>=max){lo=2;break;}}
   else {const t1=(min-a[axis])/d,t2=(max-a[axis])/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));}
  }
  if(lo<=hi&&lo<=1&&hi>=0&&(!best||lo<best.t))best={object:o,t:Math.max(0,lo)};
 }
 return best;
}
export function terrainMove(objects:readonly TerrainObject[],a:Point,b:Point,radius:number):Point {
 let p={...a};
 // Resolve authored spawns/knockback before moving, without leaving actors embedded.
 for(const o of objects){if(terrainContains(o,p,radius)){
  const exits=[{x:o.x-radius-.1,y:p.y},{x:o.x+o.width+radius+.1,y:p.y},{x:p.x,y:o.y-radius-.1},{x:p.x,y:o.y+o.height+radius+.1}];
  exits.sort((l,r)=>Math.hypot(l.x-p.x,l.y-p.y)-Math.hypot(r.x-p.x,r.y-p.y));p=exits[0]!;
 }}
 const target={x:p.x+b.x-a.x,y:p.y+b.y-a.y};
 for(const axis of ['x','y'] as const){const next={...p,[axis]:target[axis]},hit=terrainHit(objects,p,next,radius);
  if(hit)p[axis]+=(next[axis]-p[axis])*Math.max(0,hit.t-.001);else p=next;
 }
 return p;
}
export function terrainFreePoint(objects:readonly TerrainObject[],p:Point,radius=16):Point {
 return terrainMove(objects,p,p,radius);
}
/** Visibility graph around four corners; no steering oscillation against a wall. */
export function terrainWaypoint(objects:readonly TerrainObject[],a:Point,target:Point,radius:number):Point {
 if(!terrainHit(objects,a,target,radius))return target;
 const nodes=[a,target,...objects.filter(o=>o.hp>0).flatMap(o=>{
  const pad=radius+3;
  return [{x:o.x-pad,y:o.y-pad},{x:o.x+o.width+pad,y:o.y-pad},{x:o.x-pad,y:o.y+o.height+pad},{x:o.x+o.width+pad,y:o.y+o.height+pad}];
 })];
 const distances=nodes.map(()=>Infinity),parents=nodes.map(()=>-1),visited=new Set<number>();distances[0]=0;
 for(let step=0;step<nodes.length;step++){
  let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||distances[i]!<distances[current]!))current=i;
  if(current<0||!Number.isFinite(distances[current]!))break;if(current===1)break;visited.add(current);
  for(let i=1;i<nodes.length;i++){if(visited.has(i)||terrainHit(objects,nodes[current]!,nodes[i]!,radius))continue;
   const value=distances[current]!+Math.hypot(nodes[i]!.x-nodes[current]!.x,nodes[i]!.y-nodes[current]!.y);
   if(value<distances[i]!){distances[i]=value;parents[i]=current;}
  }
 }
 if(parents[1]===-1)return a;
 let next=1;while(parents[next]!==0&&parents[next]!==-1)next=parents[next]!;
 return nodes[next]!;
}
