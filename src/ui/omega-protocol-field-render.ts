import type {
 OmegaFieldPlan,OmegaFieldProgress,OmegaFieldObstacle,OmegaFieldPoint,
} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH as W,OMEGA_FIELD_HEIGHT as H,omegaFieldCanInteract,omegaFieldCurrentStep}
 from '../domain/omega-protocol-field';
import {omegaFieldNextRoute} from '../domain/omega-protocol-navigation';
import {drawOmegaSectorOneGround,drawOmegaSectorOneObstacleDetail} from './omega-protocol-sector-one-scene';
import {omegaDrawAuthoredFloor,omegaDrawAuthoredProp} from './omega-protocol-authored-scene';

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
 ctx.fillStyle='#06101bbb';ctx.fillRect(x+18,y+25,width,height);
 ctx.fillStyle=color;ctx.fillRect(x,y+15,width,height);
 ctx.fillStyle='#142a37';
 ctx.beginPath();
 ctx.moveTo(x,y+15);ctx.lineTo(x+19,y-8);
 ctx.lineTo(x+width+19,y-8);ctx.lineTo(x+width,y+15);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#b8d8e06b';ctx.lineWidth=3;ctx.strokeRect(x,y+15,width,height);
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
/** Highlight a field objective and the currently locked/open extraction gate. */
export function drawOmegaFieldMission(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 progress:OmegaFieldProgress,actor:OmegaFieldPoint,seconds:number,
):void{
 const active=omegaFieldCurrentStep(plan,progress);
 const pulse=.65+.35*Math.sin(seconds*3);
 ctx.save();
 // Compass-like in-world objective cue. It indicates bearing, NOT a
 // collision-free route through the scaffold/container cover.
 const destination=progress.phase==='exit'?plan.exit:active?.target;
 if(destination&&Number.isFinite(actor.x)&&Number.isFinite(actor.y)&&Number.isFinite(seconds)){
  const route=omegaFieldNextRoute(actor,destination,plan.obstacles,W,H);
  if(route&&route.length>100){
   const dx=route.next.x-actor.x,dy=route.next.y-actor.y;
   const distance=Math.hypot(dx,dy);
   const ux=distance>0?dx/distance:0,uy=distance>0?dy/distance:0;
   ctx.save();
   ctx.translate(actor.x+ux*65,actor.y+uy*65);
   ctx.rotate(Math.atan2(uy,ux));
   ctx.globalAlpha=.73+.22*Math.sin(seconds*5);
   ctx.shadowColor=progress.phase==='exit'?'#7dffd5':'#7ddaf5';
   ctx.shadowBlur=12;
   ctx.strokeStyle=progress.phase==='exit'?'#8effd8':'#b2f3ff';
   ctx.lineWidth=5;ctx.lineJoin='round';ctx.lineCap='round';
   ctx.beginPath();
   ctx.moveTo(-12,-11);ctx.lineTo(8,0);ctx.lineTo(-12,11);
   ctx.stroke();
   ctx.restore();
  }
 }
 for(const [index,step] of plan.event.steps.entries()){
  const target=step.target;
  const completed=index<progress.completedSteps;
  const activeStep=active?.id===step.id;
  // The original collidable-world console now renders in depth order.
  // This pass is ONLY a status glyph and interaction text, not a second
  // flat square painted over AIRA and every nearby enemy.
  ctx.shadowColor=activeStep?'#6bf9ee':'#4f9dce';
  ctx.shadowBlur=activeStep?12:0;
  ctx.fillStyle=completed?'#8bf4c2':activeStep?'#8bedff':'#aab9c4';
  ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(completed?'✓':String(index+1),target.x,target.y-78);
  ctx.shadowBlur=0;
  if(activeStep){
   ctx.strokeStyle='rgba(104,249,238,'+pulse+')';ctx.lineWidth=4;
   ctx.beginPath();ctx.arc(target.x,target.y,69,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#b3ffff';ctx.font='bold 13px system-ui';
   ctx.fillText(step.label,target.x,target.y+49);
   if(omegaFieldCanInteract(actor,target,plan.obstacles)){
    ctx.fillText('E / 조작',target.x,target.y+68);
   }
  }
 }
 const exit=plan.exit;
 if(progress.exitUnlocked){
  ctx.strokeStyle='#a4efd59d';ctx.lineWidth=4;ctx.setLineDash([15,9]);
  ctx.beginPath();ctx.moveTo(plan.event.steps[plan.event.steps.length-1]!.target.x,plan.event.steps[plan.event.steps.length-1]!.target.y);ctx.lineTo(exit.x,exit.y);ctx.stroke();
  ctx.setLineDash([]);
 }
 // Extraction portal is now a 3/4 device in the real Y-depth pass.
 ctx.fillStyle=progress.exitUnlocked?'#b3ffdf':'#ffbf8c';
 ctx.shadowColor=progress.exitUnlocked?'#77ffc2':'#ffbd81';
 ctx.shadowBlur=progress.exitUnlocked?8:0;
 ctx.font='900 13px system-ui';
 ctx.fillText(progress.exitUnlocked?'EXIT OPEN':'LOCKED',exit.x,exit.y-126);
 ctx.shadowBlur=0;
 if(progress.exitUnlocked&&omegaFieldCanInteract(actor,exit,plan.obstacles)){
  ctx.fillStyle='#b4ffe2';ctx.fillText('E / 진입',exit.x,exit.y+82);
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


/**
 * Physical boss danger zones: reads the SAME state used to apply HP damage.
 * This is combat UI/technical VFX, not a final cinematic boss character.
 */
export function drawOmegaBossTelegraph(
 ctx:CanvasRenderingContext2D,
 signal:import('../engine/omega-protocol-boss-pattern').OmegaBossTelegraph,
 time:number,
):void{
 const warning=signal.phase==='warning',strike=signal.phase==='strike';
 if(!warning&&!strike)return;
 const pulse=.65+.25*Math.sin(time*11);
 ctx.save();
 ctx.globalAlpha=warning ? 0.15+pulse*0.14 : 0.5;
 ctx.fillStyle=strike?'#ff4f70':'#ffbc66';
 ctx.strokeStyle=strike?'#ff86a1':'#ffd48e';
 ctx.lineWidth=strike?7:4;
 ctx.setLineDash(warning?[21,11]:[]);
 if(signal.attack==='crane_drop'){
  ctx.beginPath();ctx.arc(signal.center.x,signal.center.y,signal.radius,0,Math.PI*2);
  ctx.fill();ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha=warning ? 0.7 : 1;
  ctx.beginPath();ctx.moveTo(signal.center.x-22,signal.center.y);
  ctx.lineTo(signal.center.x+22,signal.center.y);
  ctx.moveTo(signal.center.x,signal.center.y-22);
  ctx.lineTo(signal.center.x,signal.center.y+22);ctx.stroke();
 }else{
  const r=signal.laneHalfWidth;
  const x=signal.lane==='vertical'?signal.center.x-r:0;
  const y=signal.lane==='horizontal'?signal.center.y-r:0;
  const width=signal.lane==='vertical'?r*2:W;
  const height=signal.lane==='horizontal'?r*2:H;
  ctx.fillRect(x,y,width,height);
  ctx.strokeRect(x,y,width,height);
  ctx.setLineDash([]);
  ctx.globalAlpha=.8;
  ctx.fillStyle=strike?'#ff90b0':'#ffe6b7';
  // Alternating hazard stripes communicate direction without relying on color.
  const span=signal.lane==='horizontal'?width:height;
  for(let dist=0;dist<span;dist+=70){
   if(signal.lane==='horizontal')ctx.fillRect(x+dist,y,8,height);
   else ctx.fillRect(x,y+dist,width,8);
  }
 }
 ctx.restore();
}
