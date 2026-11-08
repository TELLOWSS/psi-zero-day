import type {
 OmegaFieldPlan,OmegaFieldProgress,OmegaFieldObstacle,OmegaFieldPoint,
} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH as W,OMEGA_FIELD_HEIGHT as H,omegaFieldCanInteract,omegaFieldCurrentStep}
 from '../domain/omega-protocol-field';

/**
 * Original technical field art, no borrowed game assets.
 * Ground and structures are intentionally drawn as an isometric-looking
 * 2.5D blocking study; proper authored final art is a separate release gate.
 */
export function drawOmegaFieldGround(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
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
 const lightPools=[[290,160],[650,260],[1020,220],[1120,710]];
 for(const [x,y] of lightPools){
  const g=ctx.createRadialGradient(x,y,8,x,y,235);
  g.addColorStop(0,'rgba(161,219,246,.16)');g.addColorStop(1,'rgba(161,219,246,0)');
  ctx.fillStyle=g;ctx.fillRect(x-235,y-235,470,470);
 }
 // Equipment cages, containers and working platforms have their own depth.
 for(const o of plan.obstacles)drawObstacle(ctx,o,p.structures);
 ctx.font='800 20px system-ui';
 ctx.fillStyle=p.accent;ctx.fillText('SECTOR 0'+plan.sector+' · '+plan.sectorName,45,65);
 ctx.font='600 13px system-ui';
 ctx.fillStyle='#a1c3ce';ctx.fillText('NODE '+String(plan.wave).padStart(2,'0')+' / 15',45,88);
 ctx.restore();
}
function drawObstacle(ctx:CanvasRenderingContext2D,o:OmegaFieldObstacle,color:string){
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
 if(o.kind==='barrier'){
  ctx.fillStyle='#f3b34f';
  for(let i=0;i<6;i++){ctx.fillRect(x+i*width/6,y+15,width/13,height);}
 }
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
 for(const [index,step] of plan.event.steps.entries()){
  const target=step.target;
  const completed=index<progress.completedSteps;
  const activeStep=active?.id===step.id;
  ctx.shadowColor=activeStep?'#6bf9ee':'#4f9dce';
  ctx.shadowBlur=activeStep?18:3;
  ctx.fillStyle=completed?'#164c4b':'#102f49';
  ctx.fillRect(target.x-27,target.y-27,54,54);
  ctx.strokeStyle=completed?'#73f3bb':activeStep?'#7be9ff':'#5f89a4';
  ctx.lineWidth=completed?3:4;
  ctx.strokeRect(target.x-27,target.y-27,54,54);
  ctx.fillStyle=completed?'#8bf4c2':'#8bedff';
  ctx.fillRect(target.x-14,target.y-8,28,16);
  ctx.shadowBlur=0;
  ctx.fillStyle='#eefaff';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(completed?'✓':String(index+1),target.x,target.y-37);
  if(activeStep){
   ctx.strokeStyle='rgba(104,249,238,'+pulse+')';ctx.lineWidth=4;
   ctx.beginPath();ctx.arc(target.x,target.y,69,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='#b3ffff';ctx.font='bold 13px system-ui';
   ctx.fillText(step.label,target.x,target.y+49);
   if(omegaFieldCanInteract(actor,target)){
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
 ctx.shadowColor=progress.exitUnlocked?'#77ffc2':'#ffbd81';
 ctx.shadowBlur=progress.exitUnlocked?23:0;
 ctx.fillStyle=progress.exitUnlocked?'#1a805d':'#6b5347';
 ctx.fillRect(exit.x-35,exit.y-55,70,110);
 ctx.strokeStyle=progress.exitUnlocked?'#b3ffdf':'#ffac72';ctx.lineWidth=6;
 ctx.strokeRect(exit.x-35,exit.y-55,70,110);
 ctx.shadowBlur=0;
 ctx.fillStyle='#fff';ctx.font='900 13px system-ui';
 ctx.fillText(progress.exitUnlocked?'EXIT OPEN':'LOCKED',exit.x,exit.y-66);
 if(progress.exitUnlocked&&omegaFieldCanInteract(actor,exit)){
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
