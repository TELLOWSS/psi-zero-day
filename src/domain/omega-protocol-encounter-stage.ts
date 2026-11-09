import type {OmegaFieldObstacle,OmegaFieldPoint,OmegaFieldPlan} from './omega-protocol-field';
import {OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT} from './omega-protocol-field';

/** OMEGA-only visual combat staging: native Watch threat physics and health
 * remain unchanged. Native Watch originally spawns at a distant world border;
 * it made a supposedly action-heavy first field look empty for several seconds.
 * Relocate only INITIAL stage threats around the real player at navigable,
 * collision-safe positions. All encounter states remain real Watch hazards.
 */
export interface OmegaStagedThreat{
 readonly x:number;
 readonly y:number;
 readonly isStageBoss?:boolean;
 readonly radius:number;
}
const MARGIN=48;
const SAFE_ENTRY=182;
const SEPARATION=73;
const ANGLES=[0,.33,-.33,.66,-.66,.99,-.99,1.32,-1.32,1.58,-1.58,2,-2] as const;
const RADII=[200,280,360,450,550,670,790,910,1050,1200] as const;
export function omegaStageEncounterPositions(
 plan:OmegaFieldPlan,
 hero:OmegaFieldPoint,
 threats:readonly OmegaStagedThreat[],
):readonly OmegaFieldPoint[]{
 if(!Number.isFinite(hero.x)||!Number.isFinite(hero.y)||
    !Number.isInteger(plan.wave)||plan.wave<1||plan.wave>15||
    threats.length>15||
    threats.some(t=>!Number.isFinite(t.radius)||t.radius<=0||t.radius>80))
  throw new RangeError('Invalid OMEGA stage position request');
 const out:OmegaFieldPoint[]=[];
 const safe=(p:OmegaFieldPoint,radius:number,obstacles:readonly OmegaFieldObstacle[])=>{
  if(p.x<radius+22||p.y<radius+22||
     p.x>OMEGA_FIELD_WIDTH-radius-22||
     p.y>OMEGA_FIELD_HEIGHT-radius-22)return false;
  if(Math.hypot(p.x-hero.x,p.y-hero.y)<SAFE_ENTRY+Math.min(20,radius*.4))return false;
  for(const o of obstacles){
   const nearestX=Math.max(o.x,Math.min(o.x+o.width,p.x));
   const nearestY=Math.max(o.y,Math.min(o.y+o.height,p.y));
   if(Math.hypot(p.x-nearestX,p.y-nearestY)<radius+MARGIN)return false;
  }
  return out.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>SEPARATION+radius*.4);
 };
 // Front-arc first: every player should see an enemy immediately on stage 1.
 // Prefer boss in visible combat space even when the regular threat count is 14.
 const indexed=threats.map((threat,i)=>({threat,i})).sort((a,b)=>
  Number(Boolean(b.threat.isStageBoss))-Number(Boolean(a.threat.isStageBoss)));
 const placed:Array<OmegaFieldPoint|undefined>=new Array(threats.length);
 for(const {threat,i} of indexed){
  let selected:OmegaFieldPoint|undefined;
  // Three opening compositions cover both landscape and portrait:
  // front opponent, north-side flank, south-side flank. No device-dependent
  // game physics and no unsafe spawn inside the cargo/scaffold.
  const intro:readonly OmegaFieldPoint[]=[
   {x:Math.round(hero.x+205),y:Math.round(hero.y)},
   {x:Math.round(hero.x-20),y:Math.round(hero.y-210)},
   {x:Math.round(hero.x-20),y:Math.round(hero.y+210)},
  ];
  for(const point of intro){
   if(safe(point,threat.radius,plan.obstacles)){selected=point;break;}
  }
  if(!selected)for(const radius of RADII){
   for(const angle of ANGLES){
    const candidate={x:Math.round(hero.x+radius*Math.cos(angle)),
                     y:Math.round(hero.y+radius*Math.sin(angle))};
    if(safe(candidate,threat.radius,plan.obstacles)){
     selected=candidate;break;
    }
   }
   if(selected)break;
  }
  if(!selected)throw new Error('OMEGA encounter field cannot safely stage threats');
  out.push(selected);placed[i]=selected;
 }
 return placed as OmegaFieldPoint[];
}
