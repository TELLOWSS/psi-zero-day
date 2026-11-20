import type {
 OmegaFieldPlan,OmegaFieldProgress,OmegaFieldObstacle,OmegaFieldPoint,
} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH as W,OMEGA_FIELD_HEIGHT as H,omegaFieldCanInteract,omegaFieldCurrentStep}
 from '../domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../domain/omega-protocol-navigation';
import {drawOmegaSectorOneGround,drawOmegaSectorOneObstacleDetail} from './omega-protocol-sector-one-scene';
import {omegaDrawAuthoredFloor,omegaDrawAuthoredProp} from './omega-protocol-authored-scene';
import {traceRoundedRect} from './omega-protocol-navigation-hud';

/**
 * Original technical field art, no borrowed game assets.
 * Ground and structures are intentionally drawn as an isometric-looking
 * 2.5D blocking study; proper authored final art is a separate release gate.
 */
export function drawOmegaFieldGround(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 includeProps=true,
):void{
 const p=plan.palette;
 ctx.fillStyle=p.floor;ctx.fillRect(0,0,W,H);
 // Pitched pavement seams and directional construction access lanes.
 ctx.save();
 ctx.strokeStyle='rgba(145,185,196,.14)';ctx.lineWidth=1;
 for(let x=-400;x<W+400;x+=115){
  ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+390,H);ctx.stroke();
 }
 for(let y=0;y<H;y+=100){
  ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
 }
 // Ground safety route: navigable field with working objectives and a true exit.
 ctx.fillStyle='#263c46';ctx.fillRect(90,388,W-170,132);
 ctx.strokeStyle='#f5ba6388';ctx.lineWidth=4;ctx.setLineDash([22,16]);
 ctx.strokeRect(90,388,W-170,132);ctx.setLineDash([]);
 // Low-cost, original lane-light details retain contrast in small landscape
 // views. These are floor markings, not playable collision objects.
 for(let x=112;x<W-95;x+=110){
  ctx.fillStyle='#f5b56d';ctx.fillRect(x,385,29,5);
  ctx.fillStyle='#74c5d5';ctx.fillRect(x+42,519,19,4);
 }
 const lightPools:readonly (readonly [number,number])[]=[[290,160],[650,260],[1020,220],[1120,710]];
 for(const [x,y] of lightPools){
  const g=ctx.createRadialGradient(x,y,8,x,y,235);
  g.addColorStop(0,'rgba(161,219,246,.16)');g.addColorStop(1,'rgba(161,219,246,0)');
  ctx.fillStyle=g;ctx.fillRect(x-235,y-235,470,470);
 }
 // Additional world-space floor art only for the first-sector visual slice.
 // Keep under native Watch obstacles, missions, combat and hitboxes.
 drawOmegaSectorOneGround(ctx,plan);
 // Actual terrain-aligned artwork, not a static screenshot with baked enemies/HUD.
 omegaDrawAuthoredFloor(ctx,plan);
 // Every detailed object is anchored to an existing native collision solid.
 if(includeProps)for(const o of plan.obstacles)drawOmegaFieldProp(ctx,plan,o);
 ctx.font='800 20px system-ui';
 ctx.fillStyle=p.accent;ctx.fillText('SECTOR 0'+plan.sector+' · '+plan.sectorName,45,65);
 ctx.font='600 13px system-ui';
 ctx.fillStyle='#a1c3ce';ctx.fillText('NODE '+String(plan.wave).padStart(2,'0')+' / 15',45,88);
 ctx.restore();
}
/** Paint one native solid at its independently sorted depth. */
export function drawOmegaFieldProp(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,o:OmegaFieldObstacle,
):void {
 if(!omegaDrawAuthoredProp(ctx,plan,o))
  drawObstacle(ctx,o,plan.palette.structures,plan.sector===1);
}
function drawObstacle(ctx:CanvasRenderingContext2D,o:OmegaFieldObstacle,color:string,sectorOne=false){
 const {x,y,width,height}=o;
 ctx.save();
 const front=y+height;
 ctx.beginPath();ctx.rect(x,y-8,width,front-(y-8));ctx.clip();
 ctx.fillStyle=color;ctx.fillRect(x,y+15,width,height-15);
 ctx.fillStyle='#142a37';
 ctx.beginPath();
 ctx.moveTo(x,y+15);ctx.lineTo(x+12,y-8);
 ctx.lineTo(x+width,y-8);ctx.lineTo(x+width,y+15);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#b8d8e06b';ctx.lineWidth=3;ctx.strokeRect(x,y+15,width,height-15);
 ctx.strokeStyle='#0d263a99';ctx.lineWidth=2;
 for(let n=1;n<4;n++){
  ctx.beginPath();ctx.moveTo(x+width*n/4,y+20);ctx.lineTo(x+width*n/4,y+height+12);ctx.stroke();
 }
 if(o.kind==='scaffold'){
  ctx.strokeStyle='#e2b96e';ctx.lineWidth=5;
  for(let n=0;n<=4;n++){
   const px=x+n*width/4;ctx.beginPath();ctx.moveTo(px,y+10);ctx.lineTo(px,y+height+19);ctx.stroke();
  }
  for(const dy of [33,71]){
   ctx.beginPath();ctx.moveTo(x,y+dy);ctx.lineTo(x+width,y+dy);ctx.stroke();
  }
 }
 if(o.kind==='container'){
  // Distinct cargo door ribs, latch and identification panel.
  ctx.strokeStyle='#a0bdc8';ctx.lineWidth=2;
  for(let i=1;i<=5;i++){
   const px=x+i*width/6;
   ctx.beginPath();ctx.moveTo(px,y+22);ctx.lineTo(px,y+height+8);ctx.stroke();
  }
  ctx.fillStyle='#c3d9da';ctx.fillRect(x+width-29,y+height/2,5,22);
  ctx.fillStyle='#f4c784';ctx.fillRect(x+10,y+height-5,36,5);
 }
 if(o.kind==='machine'){
  // A readable machine body rather than another anonymous rectangular box.
  ctx.fillStyle='#111d2b';ctx.fillRect(x+width*.28,y+height*.28,width*.47,height*.43);
  ctx.fillStyle='#7ae4ee';ctx.fillRect(x+width*.34,y+height*.35,width*.32,height*.13);
  ctx.fillStyle='#f5bb62';ctx.fillRect(x+width*.35,y+height*.55,width*.19,5);
  ctx.strokeStyle='#b7dae6';ctx.lineWidth=3;
  ctx.beginPath();ctx.arc(x+width*.17,y+height*.76,12,0,Math.PI*2);ctx.stroke();
 }
 if(o.kind==='scaffold'){
  ctx.strokeStyle='#ffe0aa';ctx.lineWidth=2;
  for(let i=0;i<4;i++){
   const sx=x+i*width/4;
   ctx.beginPath();ctx.moveTo(sx,y+32);ctx.lineTo(sx+width/4,y+height+10);ctx.stroke();
   ctx.beginPath();ctx.moveTo(sx+width/4,y+32);ctx.lineTo(sx,y+height+10);ctx.stroke();
  }
 }
 if(o.kind==='barrier'){
  ctx.fillStyle='#f3b34f';
  for(let i=0;i<6;i++){ctx.fillRect(x+i*width/6,y+15,width/13,height);}
 }
 if(sectorOne)drawOmegaSectorOneObstacleDetail(ctx,o);
 ctx.restore();
}
function drawHolographicBadge(
 ctx:CanvasRenderingContext2D,
 x:number,
 y:number,
 text:string,
 colorHex:string,
 accentRgb:string,
 font='800 12px system-ui',
 minW=34,
):void{
 ctx.save();
 ctx.font=font;
 ctx.textAlign='center';
 const measured=ctx.measureText?.(text)?.width;
 const w=Math.max(minW,(typeof measured==='number'&&Number.isFinite(measured)?measured:text.length*8)+16);
 const h=21;
 traceRoundedRect(ctx,x-w*0.5,y-h*0.72,w,h,7);
 ctx.fillStyle='rgba(6,15,28,0.84)';
 ctx.fill();
 ctx.strokeStyle=`rgba(${accentRgb},0.72)`;
 ctx.lineWidth=1.2;
 ctx.stroke();
 ctx.fillStyle=colorHex;
 ctx.fillText(text,x,y);
 ctx.restore();
}

/** Highlight a field objective and the currently locked/open extraction gate. */
export function drawOmegaFieldMission(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 progress:OmegaFieldProgress,actor:OmegaFieldPoint,seconds:number,
 allowGlow=true,
):void{
 const active=omegaFieldCurrentStep(plan,progress);
 const pulse=.68+.32*Math.sin(seconds*3.6);
 const isExit=progress.phase==='exit';
 const navRgb=isExit?'110,231,183':'103,232,249';
 const navHex=isExit?'#8effd8':'#8ce9ff';
 ctx.save();

 // 1. Obstacle-aware holographic ground breadcrumb stream & near-hero directional arc.
 // Note: rotate() is invoked ONLY when an actionable objective/exit is >100 units away.
 const destination=isExit?plan.exit:active?.target;
 if(destination&&Number.isFinite(actor.x)&&Number.isFinite(actor.y)&&Number.isFinite(seconds)){
  const route=omegaFieldNextRoute(actor,destination,plan.obstacles,W,H);
  if(route&&route.length>100){
   const pts=[actor,...route.waypoints];
   ctx.save();
   ctx.globalCompositeOperation='lighter';

   // Flowing holographic conduit along collision-safe visibility graph route.
   ctx.strokeStyle=`rgba(${navRgb},${(0.24+0.12*pulse).toFixed(3)})`;
   ctx.lineWidth=4.5;
   ctx.lineCap='round';ctx.lineJoin='round';
   ctx.beginPath();
   ctx.moveTo(pts[0]!.x,pts[0]!.y);
   for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i]!.x,pts[i]!.y);
   ctx.stroke();

   // Crisp inner bright centerline.
   ctx.strokeStyle=`rgba(232,253,255,${(0.36+0.14*pulse).toFixed(3)})`;
   ctx.lineWidth=1.4;
   ctx.setLineDash([10,12]);
   ctx.lineDashOffset=-(seconds*64)%22;
   ctx.beginPath();
   ctx.moveTo(pts[0]!.x,pts[0]!.y);
   for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i]!.x,pts[i]!.y);
   ctx.stroke();
   ctx.setLineDash([]);

   // Animated forward-scrolling directional chevrons spaced along route segments.
   const spacing=58;
   const flowOffset=(seconds*95)%spacing;
   let carry=0;
   for(let i=0;i<pts.length-1;i++){
    const a=pts[i]!,b=pts[i+1]!;
    const segDx=b.x-a.x,segDy=b.y-a.y;
    const segLen=Math.hypot(segDx,segDy);
    if(segLen<12)continue;
    const ang=Math.atan2(segDy,segDx);
    for(let dist=flowOffset;dist<segLen-18;dist+=spacing){
     if(carry+dist<46)continue;
     const frac=dist/segLen;
     const cx=a.x+segDx*frac;
     const cy=a.y+segDy*frac;
     const fadeFrac=Math.sin(clamp((dist/spacing)%1,0.1,0.9)*Math.PI);
     ctx.save();
     ctx.translate(cx,cy);
     ctx.rotate(ang);
     ctx.strokeStyle=`rgba(${navRgb},${(0.56+0.34*fadeFrac).toFixed(3)})`;
     ctx.lineWidth=2.4;
     ctx.beginPath();
     ctx.moveTo(-7,-7);ctx.lineTo(5,0);ctx.lineTo(-7,7);
     ctx.stroke();
     ctx.restore();
    }
    carry+=segLen;
   }

   // Sleek near-hero directional chevron crest pointing toward next corner/target.
   const dx=route.next.x-actor.x,dy=route.next.y-actor.y;
   const dist=Math.hypot(dx,dy);
   const ux=dist>0?dx/dist:1,uy=dist>0?dy/dist:0;
   ctx.save();
   ctx.translate(actor.x+ux*58,actor.y+uy*58);
   ctx.rotate(Math.atan2(uy,ux));
   if(allowGlow){
    ctx.shadowColor=isExit?'#7dffd5':'#7ddaf5';
    ctx.shadowBlur=10;
   }
   ctx.strokeStyle=navHex;
   ctx.lineWidth=2.6;ctx.lineJoin='round';ctx.lineCap='round';
   ctx.beginPath();
   ctx.moveTo(-10,-9);ctx.lineTo(7,0);ctx.lineTo(-10,9);
   ctx.moveTo(-16,-6);ctx.lineTo(-4,0);ctx.lineTo(-16,6);
   ctx.stroke();
   ctx.restore();

   ctx.restore();
  }
 }

 // 2. Console holographic floor pads & compact rounded status badges.
 for(const [index,step] of plan.event.steps.entries()){
  const target=step.target;
  const completed=index<progress.completedSteps;
  const activeStep=active?.id===step.id;
  const badgeColor=completed?'#8bf4c2':activeStep?'#9cf3ff':'#94aec2';
  const badgeRgb=completed?'110,231,183':activeStep?'103,232,249':'126,162,188';

  if(activeStep){
   ctx.save();
   ctx.globalCompositeOperation='lighter';
   const halo=ctx.createRadialGradient?.(target.x,target.y,10,target.x,target.y,78);
   if(halo&&typeof halo.addColorStop==='function'){
    halo.addColorStop(0,'rgba(103,232,249,0.22)');
    halo.addColorStop(0.72,'rgba(103,232,249,0.08)');
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;
    ctx.beginPath();ctx.ellipse(target.x,target.y+2,76,28,0,0,Math.PI*2);ctx.fill();
   }
   ctx.strokeStyle=`rgba(103,232,249,${(0.45+0.42*pulse).toFixed(3)})`;
   ctx.lineWidth=2.2;
   ctx.beginPath();ctx.ellipse(target.x,target.y+2,56+pulse*7,21+pulse*3,0,0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([8,6]);
   ctx.lineDashOffset=-(seconds*28)%14;
   ctx.strokeStyle='rgba(216,251,255,0.58)';
   ctx.lineWidth=1.3;
   ctx.beginPath();ctx.ellipse(target.x,target.y+2,42,15.5,0,0,Math.PI*2);ctx.stroke();
   ctx.setLineDash([]);
   ctx.restore();
  }

  drawHolographicBadge(
   ctx,
   target.x,
   target.y-82,
   completed?'✓':String(index+1),
   badgeColor,
   badgeRgb,
   '800 11px system-ui',
   24,
  );
  if(activeStep){
   drawHolographicBadge(ctx,target.x,target.y+46,step.label,'#c7fbff','103,232,249','800 11px system-ui',74);
   if(omegaFieldCanInteract(actor,target,plan.obstacles)){
    drawHolographicBadge(ctx,target.x,target.y+69,'E · 조작','#fde68a','251,191,36','900 11px system-ui',62);
   }
  }
 }

 // 3. Extraction portal holographic gate tag & interaction prompt.
 const exit=plan.exit;
 const exitColor=progress.exitUnlocked?'#9efce0':'#ffc08e';
 const exitRgb=progress.exitUnlocked?'110,231,183':'251,146,60';
 drawHolographicBadge(
  ctx,
  exit.x,
  exit.y-126,
  progress.exitUnlocked?'EXIT OPEN':'LOCKED',
  exitColor,
  exitRgb,
  '900 11px system-ui',
  68,
 );
 if(progress.exitUnlocked&&omegaFieldCanInteract(actor,exit,plan.obstacles)){
  drawHolographicBadge(ctx,exit.x,exit.y+74,'E · 구역 진입','#a7ffeb','110,231,183','900 11px system-ui',76);
 }
 ctx.restore();
}

/** Actor must be visually obscured by props when passing behind structures. */
export function drawOmegaFieldOcclusion(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,actor:OmegaFieldPoint,
):void{
 for(const o of plan.obstacles){
  if(actor.x<o.x-22||actor.x>o.x+o.width+22||
     actor.y>o.y+o.height+15||actor.y<o.y-45)continue;
  ctx.save();
  ctx.fillStyle=plan.palette.structures;ctx.globalAlpha=.48;
  ctx.fillRect(o.x,o.y+15,o.width,o.height);
  ctx.restore();
 }
}

function clamp(v:number,lo:number,hi:number):number{
 return v<lo?lo:v>hi?hi:v;
}

/**
 * Physical boss danger zones: reads the SAME state used to apply HP damage.
 * Holographic tactical floor projections with animated timing rings & chevrons.
 */
export function drawOmegaBossTelegraph(
 ctx:CanvasRenderingContext2D,
 signal:import('../engine/omega-protocol-boss-pattern').OmegaBossTelegraph,
 time:number,
):void{
 const warning=signal.phase==='warning',strike=signal.phase==='strike';
 if(!warning&&!strike)return;
 const t=Number.isFinite(time)?time:0;
 const pulse=.65+.35*Math.sin(t*12);
 const rgb=strike?'255,78,122':'255,186,84';
 const edgeHex=strike?'#ff9bb8':'#ffe0a3';

 ctx.save();
 ctx.globalCompositeOperation='lighter';

 if(signal.attack==='crane_drop'){
  const r=Math.max(12,signal.radius);
  const pool=ctx.createRadialGradient?.(signal.center.x,signal.center.y,4,signal.center.x,signal.center.y,r);
  if(pool&&typeof pool.addColorStop==='function'){
   pool.addColorStop(0,`rgba(${rgb},${(strike?0.42:0.14).toFixed(3)})`);
   pool.addColorStop(0.74,`rgba(${rgb},${(strike?0.26:0.18*pulse).toFixed(3)})`);
   pool.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=pool;
  }else{
   ctx.fillStyle=`rgba(${rgb},${strike?0.36:0.18})`;
  }
  ctx.beginPath();ctx.arc(signal.center.x,signal.center.y,r,0,Math.PI*2);ctx.fill();

  // Outer perimeter ring.
  ctx.strokeStyle=`rgba(${rgb},${(strike?0.94:0.72*pulse).toFixed(3)})`;
  ctx.lineWidth=strike?3.5:2.2;
  ctx.setLineDash(warning?[16,9]:[]);
  ctx.beginPath();ctx.arc(signal.center.x,signal.center.y,r,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  // Converging inner countdown ring during warning.
  const shrink=warning?clamp(signal.timer/1.15,0.18,1):1;
  ctx.strokeStyle=edgeHex;
  ctx.lineWidth=1.8;
  ctx.beginPath();ctx.arc(signal.center.x,signal.center.y,r*shrink,0,Math.PI*2);ctx.stroke();

  // Tactical impact crosshair ticks.
  ctx.strokeStyle=edgeHex;
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(signal.center.x-18,signal.center.y);ctx.lineTo(signal.center.x-6,signal.center.y);
  ctx.moveTo(signal.center.x+6,signal.center.y);ctx.lineTo(signal.center.x+18,signal.center.y);
  ctx.moveTo(signal.center.x,signal.center.y-18);ctx.lineTo(signal.center.x,signal.center.y-6);
  ctx.moveTo(signal.center.x,signal.center.y+6);ctx.lineTo(signal.center.x,signal.center.y+18);
  ctx.stroke();
 }else{
  const r=signal.laneHalfWidth;
  const x=signal.lane==='vertical'?signal.center.x-r:0;
  const y=signal.lane==='horizontal'?signal.center.y-r:0;
  const width=signal.lane==='vertical'?r*2:W;
  const height=signal.lane==='horizontal'?r*2:H;

  const corridorGrad=signal.lane==='horizontal'
   ?ctx.createLinearGradient?.(x,y,x,y+height)
   :ctx.createLinearGradient?.(x,y,x+width,y);
  if(corridorGrad&&typeof corridorGrad.addColorStop==='function'){
   corridorGrad.addColorStop(0,`rgba(${rgb},0.05)`);
   corridorGrad.addColorStop(0.5,`rgba(${rgb},${(strike?0.42:0.20*pulse).toFixed(3)})`);
   corridorGrad.addColorStop(1,`rgba(${rgb},0.05)`);
   ctx.fillStyle=corridorGrad;
  }else{
   ctx.fillStyle=`rgba(${rgb},${strike?0.35:0.16})`;
  }
  ctx.fillRect(x,y,width,height);

  // Twin boundary laser rails.
  ctx.strokeStyle=`rgba(${rgb},${(strike?0.92:0.70*pulse).toFixed(3)})`;
  ctx.lineWidth=strike?3:2;
  ctx.setLineDash(warning?[18,10]:[]);
  ctx.beginPath();
  if(signal.lane==='horizontal'){
   ctx.moveTo(x,y);ctx.lineTo(x+width,y);
   ctx.moveTo(x,y+height);ctx.lineTo(x+width,y+height);
  }else{
   ctx.moveTo(x,y);ctx.lineTo(x,y+height);
   ctx.moveTo(x+width,y);ctx.lineTo(x+width,y+height);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Centerline surge beam + directional chevron markers along sweep axis.
  ctx.strokeStyle=edgeHex;
  ctx.lineWidth=strike?3.2:1.6;
  const span=signal.lane==='horizontal'?width:height;
  const step=88;
  const flow=(t*(strike?260:110))%step;
  for(let dist=flow;dist<span-20;dist+=step){
   ctx.beginPath();
   if(signal.lane==='horizontal'){
    const cx=x+dist,cy=y+height*0.5;
    ctx.moveTo(cx-10,cy-12);ctx.lineTo(cx+6,cy);ctx.lineTo(cx-10,cy+12);
   }else{
    const cx=x+width*0.5,cy=y+dist;
    ctx.moveTo(cx-12,cy-10);ctx.lineTo(cx,cy+6);ctx.lineTo(cx+12,cy-10);
   }
   ctx.stroke();
  }
 }
 ctx.restore();
}
