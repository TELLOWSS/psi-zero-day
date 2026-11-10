import type {OmegaFieldObstacle,OmegaFieldPlan} from '../domain/omega-protocol-field';

/**
 * M12-G2 — wholly original, deterministic industrial scene illustration.
 * 2D Canvas only; renders into the existing world/quater-view camera.
 * Functional-looking foreground machinery is registered to one of the four
 * original native Watch collision footprints. Distant silhouettes are scenic,
 * pale, non-interactive background artwork and supply NO new path/cover.
 */
export interface OmegaG2Quality {
 readonly tier:'low'|'balanced'|'detail';
 readonly facadeWindows:number;
 readonly trussBraces:number;
 readonly glow:boolean;
}
export function omegaG2Quality(w:number,h:number):OmegaG2Quality {
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)
  throw new RangeError('Invalid G2 viewport');
 const pixels=w*h;
 if(pixels<=350_000)return {tier:'low',facadeWindows:5,trussBraces:3,glow:false};
 if(pixels<=900_000)return {tier:'balanced',facadeWindows:8,trussBraces:5,glow:false};
 return {tier:'detail',facadeWindows:13,trussBraces:8,glow:true};
}
export type OmegaG2Layer='rear-skyline'|'rear-crane'|'native-gangform'|'native-hoist'|'native-cargo'|'boundary-rail';
export interface OmegaG2Part{
 readonly layer:OmegaG2Layer;
 readonly sourceId:string|null;
 readonly decorative:boolean;
}
const ONE=1;
export function omegaG2SceneManifest(plan:OmegaFieldPlan):readonly OmegaG2Part[]{
 if(plan.sector!==ONE)return [];
 const has=(id:string)=>plan.obstacles.some(o=>o.id===id);
 return [
  {layer:'rear-skyline',sourceId:null,decorative:true},
  {layer:'rear-crane',sourceId:null,decorative:true},
  ...(has('scaffold')?[{layer:'native-gangform' as const,sourceId:'scaffold',decorative:true}]:[]),
  ...(has('machine')?[{layer:'native-hoist' as const,sourceId:'machine',decorative:true}]:[]),
  ...(has('cargo')?[{layer:'native-cargo' as const,sourceId:'cargo',decorative:true}]:[]),
  {layer:'boundary-rail',sourceId:null,decorative:true},
 ];
}
const isFirst=(plan:OmegaFieldPlan)=>plan.sector===ONE;
function segment(ctx:CanvasRenderingContext2D,ax:number,ay:number,bx:number,by:number):void{
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
}
function polygon(ctx:CanvasRenderingContext2D,coords:readonly number[]):void{
 ctx.beginPath();
 ctx.moveTo(coords[0]!,coords[1]!);
 for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i]!,coords[i+1]!);
 ctx.closePath();ctx.fill();
}
function beam(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,shade:string):void{
 ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
 ctx.strokeStyle='rgba(176,215,231,.30)';ctx.lineWidth=1;
 ctx.strokeRect(x+.5,y+.5,w-1,h-1);
}
/** Independent near/far illustration; no collision is registered. */
export function drawOmegaG2RearEnvironment(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,time:number,quality:OmegaG2Quality,
):void {
 if(!isFirst(plan)||!Number.isFinite(time))return;
 ctx.save();
 // Distant buildings remain behind actual ground, characters, hazards and HUD.
 const haze=ctx.createLinearGradient(0,-85,0,198);
 haze.addColorStop(0,'rgba(31,58,80,.44)');
 haze.addColorStop(1,'rgba(18,40,59,0)');
 ctx.fillStyle=haze;ctx.fillRect(0,-85,1400,283);
 const mass=[
  [0,-58,158,186],[148,-78,118,196],[276,-26,184,154],
  [432,-61,138,197],[574,-35,190,162],[775,-69,129,193],
  [915,-42,182,178],[1112,-60,151,194],[1250,-26,150,165],
 ] as const;
 for(let i=0;i<mass.length;i++){
  const [x,y,w,h]=mass[i]!;
  ctx.fillStyle=i%3===0?'rgba(38,61,78,.55)':'rgba(33,54,71,.42)';
  ctx.fillRect(x,y,w,h);
  ctx.fillStyle='rgba(105,145,163,.07)';ctx.fillRect(x+5,y+5,w-10,5);
  if(quality.tier!=='low'){
   ctx.fillStyle='rgba(154,188,196,.10)';
   for(let n=0;n<quality.facadeWindows;n++){
    const wx=x+13+(n%5)*Math.max(13,(w-32)/5);
    const wy=y+17+Math.floor(n/5)*25;
    if(wx<x+w-11&&wy<y+h-18)ctx.fillRect(wx,wy,9,5);
   }
  }
 }
 // Tower crane is a distant NON-SOLID silhouette rather than new ground cover.
 const towerX=1105,footY=165,headY=-86;
 ctx.strokeStyle='rgba(85,125,145,.43)';ctx.lineWidth=8;
 segment(ctx,towerX,footY,towerX,headY);
 ctx.lineWidth=3;
 segment(ctx,towerX-23,headY+18,towerX+26,headY+18);
 segment(ctx,855,headY+5,1386,headY+5);
 for(let n=0;n<quality.trussBraces*2;n++){
  const xx=856+n*530/(quality.trussBraces*2);
  ctx.strokeStyle='rgba(151,192,208,.25)';ctx.lineWidth=2;
  segment(ctx,xx,headY+5,xx+22,headY-13);
  if(n%2===0)segment(ctx,towerX-5,headY+n*17,towerX+5,headY+n*17+12);
 }
 ctx.strokeStyle='rgba(215,184,126,.30)';ctx.lineWidth=1.5;
 segment(ctx,1295,headY+5,1295,headY+91);
 segment(ctx,1285,headY+91,1305,headY+91);
 const workLights=[{x:178,y:115},{x:860,y:96},{x:1270,y:130}];
 for(const light of workLights){
  ctx.fillStyle='rgba(250,201,129,.48)';
  ctx.beginPath();ctx.arc(light.x,light.y,4,0,Math.PI*2);ctx.fill();
  if(quality.glow){
   const g=ctx.createRadialGradient(light.x,light.y,2,light.x,light.y,65);
   g.addColorStop(0,'rgba(255,182,104,.10)');g.addColorStop(1,'rgba(255,182,104,0)');
   ctx.fillStyle=g;ctx.fillRect(light.x-65,light.y-65,130,130);
  }
 }
 ctx.restore();
}

/** Build a detailed framed facade entirely within actual solid X footprint. */
function drawCargoCladding(ctx:CanvasRenderingContext2D,o:OmegaFieldObstacle,quality:OmegaG2Quality):void{
 const x=o.x,y=o.y,w=o.width,h=o.height;
 ctx.save();
 // Tall, pitched container skin with side cast and rivet rails.
 const grad=ctx.createLinearGradient(x,y-74,x+w,y+h);
 grad.addColorStop(0,'rgba(91,126,148,.76)');
 grad.addColorStop(.4,'rgba(44,77,96,.68)');
 grad.addColorStop(1,'rgba(8,25,39,.70)');
 ctx.fillStyle=grad;
 polygon(ctx,[x+3,y-70,x+w-4,y-70,x+w-4,y+h+7,x+3,y+h+7]);
 beam(ctx,x+8,y-70,w-16,9,'rgba(181,218,223,.42)');
 ctx.strokeStyle='rgba(194,228,227,.30)';ctx.lineWidth=2;
 for(let i=1;i<8;i++){
  const xx=x+8+(w-16)*i/8;
  segment(ctx,xx,y-57,xx,y+h);
 }
 // Material splits, hazard ID and wheel-level shadow are decorative only.
 ctx.fillStyle='rgba(231,181,98,.75)';ctx.fillRect(x+17,y-19,65,13);
 ctx.fillStyle='rgba(10,25,37,.75)';ctx.fillRect(x+22,y-16,54,7);
 ctx.fillStyle='rgba(113,181,204,.26)';ctx.fillRect(x+13,y+43,w-26,4);
 if(quality.tier!=='low'){
  ctx.fillStyle='rgba(221,238,227,.52)';
  for(let side=0;side<2;side++)for(let n=0;n<6;n++){
   const bx=x+(side===0?10:w-10),by=y-48+n*28;
   ctx.fillRect(bx,by,2.5,2.5);
  }
 }
 ctx.restore();
}
function drawGangform(ctx:CanvasRenderingContext2D,o:OmegaFieldObstacle,quality:OmegaG2Quality):void{
 const x=o.x,y=o.y,w=o.width,h=o.height;
 // Not a climbable new platform. High rail and panel are tied to scaffold solid.
 ctx.save();
 const top=y-95,front=y+h+7;
 const grad=ctx.createLinearGradient(x,top,x+w,front);
 grad.addColorStop(0,'rgba(128,165,178,.72)');
 grad.addColorStop(.43,'rgba(59,96,111,.62)');
 grad.addColorStop(1,'rgba(12,29,45,.70)');
 ctx.fillStyle=grad;polygon(ctx,[x+5,top,x+w-5,top,x+w-5,front,x+5,front]);
 for(let level=0;level<3;level++){
  const yy=top+23+level*60;
  beam(ctx,x+8,yy,w-16,8,'rgba(153,188,194,.66)');
  ctx.fillStyle='rgba(24,51,68,.55)';
  ctx.fillRect(x+12,yy+9,w-24,40);
  ctx.strokeStyle='rgba(135,186,202,.37)';ctx.lineWidth=1.5;
  segment(ctx,x+16,yy+12,x+w-17,yy+43);
  segment(ctx,x+w-17,yy+12,x+16,yy+43);
 }
 // Upright pipe-frames and tie bolts.
 ctx.strokeStyle='rgba(213,218,200,.72)';ctx.lineWidth=4;
 for(let n=0;n<5;n++){
  const xx=x+9+n*(w-18)/4;
  segment(ctx,xx,top-8,xx,front);
 }
 ctx.strokeStyle='rgba(245,193,97,.80)';ctx.lineWidth=3.3;
 segment(ctx,x+5,top+6,x+w-5,top+6);
 segment(ctx,x+5,top+60,x+w-5,top+60);
 if(quality.tier!=='low'){
  ctx.fillStyle='rgba(252,190,100,.23)';
  for(let i=0;i<10;i++)ctx.fillRect(x+13+i*(w-26)/10,top+11,4,5);
 }
 ctx.restore();
}
function drawHoist(ctx:CanvasRenderingContext2D,o:OmegaFieldObstacle,quality:OmegaG2Quality,time:number):void{
 const x=o.x,y=o.y,w=o.width,h=o.height;
 const tower=x+w*.55,left=tower-27,right=tower+29,top=y-80,bottom=y+h;
 ctx.save();
 // Shaft sits inside the EXISTING machine footprint, with no new blocking.
 ctx.fillStyle='rgba(4,22,35,.61)';ctx.fillRect(left,top,56,bottom-top);
 ctx.strokeStyle='rgba(159,204,215,.70)';ctx.lineWidth=3;
 segment(ctx,left,top,left,bottom);segment(ctx,right,top,right,bottom);
 for(let n=0;n<6;n++){
  const yy=top+n*(bottom-top)/5;
  ctx.strokeStyle='rgba(135,189,203,.33)';ctx.lineWidth=2;
  segment(ctx,left,yy,right,yy);
  if(n<5)segment(ctx,left,yy,right,yy+(bottom-top)/5);
 }
 const carTop=y+9+Math.sin(time*.45)*3;
 const carY=Math.min(y+h-50,Math.max(top+18,carTop));
 const g=ctx.createLinearGradient(left+4,carY,right-4,carY+49);
 g.addColorStop(0,'rgba(183,210,209,.86)');
 g.addColorStop(1,'rgba(48,83,97,.85)');
 ctx.fillStyle=g;ctx.fillRect(left+5,carY,46,47);
 ctx.fillStyle='rgba(9,36,51,.89)';ctx.fillRect(left+11,carY+10,34,23);
 ctx.fillStyle='rgba(115,210,223,.40)';ctx.fillRect(left+12,carY+11,14,5);
 ctx.strokeStyle='rgba(230,197,135,.80)';ctx.lineWidth=3;
 segment(ctx,left+4,carY,right-4,carY);
 segment(ctx,tower,top,tower,carY);
 if(quality.tier==='detail'){
  ctx.fillStyle='rgba(252,192,102,.70)';ctx.fillRect(right-11,carY+30,5,5);
 }
 ctx.restore();
}
/**
 * Called INSIDE the existing sorted prop pass, after the native SVG.
 * Native obstacles remain the only physics/LOS reference.
 */
export function drawOmegaG2NativeFacade(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,obstacle:OmegaFieldObstacle,
 time:number,quality:OmegaG2Quality,
):void{
 if(!isFirst(plan)||!Number.isFinite(time))return;
 // Refuse loose objects: no unsupported decorative obstruction outside solids.
 if(!plan.obstacles.some(o=>o===obstacle))return;
 if(obstacle.kind==='scaffold')drawGangform(ctx,obstacle,quality);
 else if(obstacle.kind==='machine')drawHoist(ctx,obstacle,quality,time);
 else if(obstacle.kind==='container')drawCargoCladding(ctx,obstacle,quality);
}
/** Foreground world-boundary metalwork stays OUTSIDE valid actor foot path. */
export function drawOmegaG2BoundaryRail(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,quality:OmegaG2Quality,
):void{
 if(!isFirst(plan))return;
 ctx.save();
 // Bottom edge beyond native actor walk max y=880, never over living targets.
 ctx.strokeStyle='rgba(96,139,154,.47)';ctx.lineWidth=3;
 segment(ctx,0,899,1400,899);
 ctx.strokeStyle='rgba(225,174,102,.38)';ctx.lineWidth=3;
 segment(ctx,0,887,1400,887);
 ctx.fillStyle='rgba(19,43,56,.56)';
 const step=quality.tier==='low'?210:115;
 for(let x=0;x<=1400;x+=step)ctx.fillRect(x,886,5,14);
 ctx.restore();
}
