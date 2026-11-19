import type {OmegaFieldObstacle,OmegaFieldPlan,OmegaFieldPoint} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_HEIGHT as FIELD_H,OMEGA_FIELD_WIDTH as FIELD_W} from '../domain/omega-protocol-field';
import {omegaConnectedDeckElevation} from '../domain/omega-protocol-field-transit';
import {omega3DSectorTheme,type Omega3DBudget} from './omega-protocol-atmosphere-3d';
import type {OmegaCameraState} from './omega-protocol-camera';

/**
 * Brings all 5 sectors (15 connected zones) to life with deterministic,
 * GPU-friendly world motion: sweeping horizon searchlights, skyline drones,
 * puddle raindrop ripples, perimeter drifting steam, spinning machine turbines,
 * swaying scaffold work-lanterns, cascading welding sparks, and AIRA proximity
 * cover rim-lighting.
 */

const DECK_PROP_RISE:Readonly<Record<OmegaFieldObstacle['kind'],number>>={
 container:78,scaffold:127,machine:63,barrier:29,
};

const GROUND_PROP_RISE:Readonly<Record<OmegaFieldObstacle['kind'],number>>={
 container:72,scaffold:95,machine:80,barrier:38,
};

const WET_PUDDLES:readonly (readonly [number,number,number,number])[]=[
 [185,332,78,15],[455,674,94,17],[815,282,102,16],[1175,442,110,18],
 [645,488,88,15],[320,785,84,14],[1035,772,92,16],[975,168,74,13],
];

const propRise=(plan:OmegaFieldPlan,kind:OmegaFieldObstacle['kind']):number=>
 omegaConnectedDeckElevation(plan.wave)>0?DECK_PROP_RISE[kind]:GROUND_PROP_RISE[kind];

function fillPoly(ctx:CanvasRenderingContext2D,coords:readonly number[]):void {
 ctx.beginPath();
 ctx.moveTo(coords[0]!,coords[1]!);
 for(let i=2;i<coords.length;i+=2)ctx.lineTo(coords[i]!,coords[i+1]!);
 ctx.closePath();
 ctx.fill();
}

function drawLine(ctx:CanvasRenderingContext2D,ax:number,ay:number,bx:number,by:number):void {
 ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
}

/**
 * Living distant backdrop life: sweeping volumetric searchlights, patrolling
 * horizon micro-drones, foundry chasm glow, storm sheet-lightning, and reactor
 * pulse rings. Rendered in screen space behind the active arena deck.
 */
export function drawOmegaLivingBackdrop(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 camera:OmegaCameraState,
 width:number,
 height:number,
 seconds:number,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds)||!Number.isFinite(width)||!Number.isFinite(height)||
    width<=0||height<=0||!Number.isFinite(camera.scale)||
    !Number.isFinite(camera.projectedOffsetX))
  return;
 const theme=omega3DSectorTheme(plan.sector);
 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);

 // 1. Sweeping distant volumetric searchlights pivoting across horizon.
 const beams=budget.tier==='mobile'?2:3;
 for(let i=0;i<beams;i++){
  const baseX=width*(0.2+i*0.3)+(camera.projectedOffsetX*camera.scale*0.08)%120;
  const baseY=height*0.06;
  const sweep=Math.sin(seconds*(0.38+i*0.09)+i*1.9)*width*0.24;
  const endX=baseX+sweep;
  const endY=height*0.86;
  const rgb=i%2===0?theme.fillRgb:theme.keyRgb;
  const grad=ctx.createLinearGradient(baseX,baseY,endX,endY);
  grad.addColorStop(0,`rgba(${rgb},.11)`);
  grad.addColorStop(.65,`rgba(${rgb},.045)`);
  grad.addColorStop(1,`rgba(${rgb},0)`);
  ctx.fillStyle=grad;
  fillPoly(ctx,[
   baseX-10,baseY,baseX+10,baseY,
   endX+width*0.09,endY,endX-width*0.09,endY,
  ]);
 }

 // 2. Patrolling distant skyline micro-drones / aerial tram silhouettes.
 const drones=budget.tier==='mobile'?2:4;
 for(let i=0;i<drones;i++){
  const dir=i%2===0?1:-1;
  const speed=22+i*9;
  const rawX=(seconds*speed*dir+i*310)%(width+160);
  const dx=((rawX%(width+160))+(width+160))%(width+160)-80;
  const dy=height*(0.11+i*0.055)+Math.sin(seconds*1.6+i*2.1)*5;
  ctx.fillStyle=theme.structureMid;
  ctx.fillRect(dx-11,dy-2,22,4);
  ctx.fillRect(dx-5,dy-5,10,3);
  const blink=0.45+0.55*Math.sin(seconds*6.5+i*1.7);
  ctx.fillStyle=`rgba(${i%2===0?theme.keyRgb:theme.fillRgb},${blink.toFixed(2)})`;
  ctx.beginPath();ctx.arc(dx+dir*11,dy,2.3,0,Math.PI*2);ctx.fill();
 }

 // 3. Sector-specific living architectural backdrop motion.
 if(theme.sector===2){
  // Rising molten forge glow waves from the lower abyss.
  const pulse=0.5+0.5*Math.sin(seconds*1.9);
  const forge=ctx.createRadialGradient(
   width*0.5,height*0.95,12,width*0.5,height*0.95,height*0.48,
  );
  forge.addColorStop(0,`rgba(255,148,70,${(0.14+0.09*pulse).toFixed(3)})`);
  forge.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=forge;
  ctx.fillRect(0,height*0.45,width,height*0.55);
 }else if(theme.sector===3){
  // Distant periodic storm cloud sheet-lightning shimmer.
  const flash=Math.pow(Math.max(0,Math.sin(seconds*0.95)*Math.sin(seconds*2.1+0.6)),16);
  if(flash>0.03){
   ctx.fillStyle=`rgba(198,175,255,${(flash*0.18).toFixed(3)})`;
   ctx.fillRect(0,0,width,height*0.42);
  }
 }else if(theme.sector===5){
  // Pulsing radial core energy ripples radiating out from Omega Core reactor.
  const wave=(seconds*0.42)%1;
  const r=Math.min(width,height)*(0.12+wave*0.36);
  ctx.strokeStyle=`rgba(255,112,164,${((1-wave)*0.22).toFixed(3)})`;
  ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(width*0.5,height*0.24,r,0,Math.PI*2);ctx.stroke();
 }

 ctx.restore();
}

/**
 * Living arena surface motion: expanding raindrop ripples in wet puddles,
 * drifting perimeter steam ribbons, and subtle animated corridor wayfinding chevrons.
 */
export function drawOmegaLivingGround(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 seconds:number,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds))return;
 const theme=omega3DSectorTheme(plan.sector);
 ctx.save();

 // 1. Expanding concentric raindrop ripples in wet puddles (Sectors 1, 3, 4).
 if(plan.sector===1||plan.sector===3||plan.sector===4){
  const count=Math.min(budget.puddles,WET_PUDDLES.length);
  for(let i=0;i<count;i++){
   const [px,py,rx,ry]=WET_PUDDLES[i]!;
   const cycle=((seconds*0.78+i*0.37)%1);
   const alpha=(1-cycle)*0.34;
   ctx.strokeStyle=`rgba(${theme.fillRgb},${alpha.toFixed(3)})`;
   ctx.lineWidth=1.2;
   ctx.beginPath();
   ctx.ellipse(
    px+Math.sin(i*3.1)*rx*0.25,
    py+Math.cos(i*2.3)*ry*0.2,
    (8+rx*0.42*cycle),(2.5+ry*0.38*cycle),0,0,Math.PI*2,
   );
   ctx.stroke();
  }
 }

 // 2. Drifting perimeter ground-hugging steam/fog ribbons outside center lane.
 const wisps=budget.tier==='mobile'?2:4;
 for(let i=0;i<wisps;i++){
  const edgeY=i%2===0?52+i*14:FIELD_H-58-i*12;
  const x=((seconds*(32+i*9)+i*340)%(FIELD_W+320))-160;
  const fog=ctx.createRadialGradient(x,edgeY,14,x,edgeY,155);
  fog.addColorStop(0,`rgba(${theme.fillRgb},.075)`);
  fog.addColorStop(1,`rgba(${theme.fillRgb},0)`);
  ctx.fillStyle=fog;
  ctx.fillRect(x-160,edgeY-70,320,140);
 }

 // 3. Animated wayfinding chevrons guiding along the main horizontal safety route.
 const laneY=454;
 const activeChevron=Math.floor(seconds*4.5)%8;
 for(let i=0;i<8;i++){
  const cx=180+i*150;
  const dist=Math.abs(i-activeChevron);
  const glow=dist===0?0.36:dist===1?0.20:0.08;
  ctx.strokeStyle=`rgba(${theme.accentGlow==='#'?'148,243,252':theme.fillRgb},${glow.toFixed(2)})`;
  ctx.lineWidth=2.4;
  ctx.beginPath();
  ctx.moveTo(cx-7,laneY-7);ctx.lineTo(cx+4,laneY);ctx.lineTo(cx-7,laneY+7);
  ctx.stroke();
 }

 ctx.restore();
}

/**
 * Brings genuine arena structures alive: AIRA dynamic hero proximity rim light,
 * rotating machine turbines & rising steam vents, swaying scaffold work-lanterns,
 * cascading welding sparks, rainwater drips, and sequential barrier strobe flares.
 */
export function drawOmegaLivingProp(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 obstacle:OmegaFieldObstacle,
 player:OmegaFieldPoint,
 seconds:number,
 budget:Omega3DBudget,
):void {
 if(!Number.isFinite(seconds)||!Number.isFinite(player.x)||!Number.isFinite(player.y)||
    !plan.obstacles.includes(obstacle))
  return;
 const theme=omega3DSectorTheme(plan.sector);
 const {x,y,width:w,height:h,kind}=obstacle;
 const rise=propRise(plan,kind);
 const top=y-rise;
 const bottom=y+h;
 const cx=x+w*0.5,cy=y+h*0.5;

 ctx.save();

 // 1. Dynamic Hero Torchlight Rim Response on obstacle edges nearest AIRA.
 const dx=player.x-cx,dy=player.y-cy;
 const dist=Math.hypot(dx,dy);
 if(dist<290){
  const strength=(1-dist/290)*0.48;
  ctx.strokeStyle=`rgba(${theme.fillRgb},${strength.toFixed(2)})`;
  ctx.lineWidth=2.6;
  const edgeX=dx<0?x+2:x+w-2;
  drawLine(ctx,edgeX,top+8,edgeX,bottom-4);
  if(dy<0)drawLine(ctx,x+4,top+2,x+w-4,top+2);
  else drawLine(ctx,x+4,bottom-2,x+w-4,bottom-2);
 }

 // 2. Kind-specific animated machinery & structural life.
 if(kind==='machine'){
  // Spinning 4-blade intake turbine fan.
  const fanX=x+w*0.76,fanY=top+(bottom-top)*0.46;
  const fanR=Math.min(18,Math.max(10,w*0.11));
  ctx.fillStyle='#09131d';
  ctx.beginPath();ctx.arc(fanX,fanY,fanR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(${theme.fillRgb},.52)`;ctx.lineWidth=1.8;ctx.stroke();
  const angle=seconds*5.4+x*0.02;
  ctx.strokeStyle=`rgba(${theme.fillRgb},.78)`;ctx.lineWidth=2.4;
  for(let b=0;b<4;b++){
   const a=angle+b*(Math.PI/2);
   drawLine(ctx,fanX,fanY,fanX+Math.cos(a)*(fanR-3),fanY+Math.sin(a)*(fanR-3));
  }
  // 4-bar pulsing power equalizer telemetry strip.
  const barX=x+w*0.2,barY=top+16;
  for(let b=0;b<4;b++){
   const hBar=4+5*(0.5+0.5*Math.sin(seconds*6.2+b*1.1+x*0.01));
   ctx.fillStyle=`rgba(${theme.keyRgb},.80)`;
   ctx.fillRect(barX+b*6,barY-hBar,4,hBar);
  }
  // Rising pressurized steam/coolant exhaust puffs above roof vent.
  const puffCount=budget.tier==='mobile'?2:3;
  const ventX=x+w*0.32,ventY=top+3;
  for(let p=0;p<puffCount;p++){
   const life=(seconds*0.68+p/puffCount+x*0.003)%1;
   const px=ventX+Math.sin(life*6+p)*8;
   const py=ventY-life*38;
   const pr=6+life*13;
   ctx.fillStyle=`rgba(195,232,240,${((1-life)*0.20).toFixed(3)})`;
   ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.fill();
  }
 }else if(kind==='scaffold'){
  // Swaying hanging work lantern & soft oscillating light cone.
  const anchorX=x+w*0.5,anchorY=top+14;
  const swing=Math.sin(seconds*1.85+x*0.02)*11;
  const lampX=anchorX+swing,lampY=anchorY+26;
  ctx.strokeStyle='rgba(170,205,215,.55)';ctx.lineWidth=1.5;
  drawLine(ctx,anchorX,anchorY,lampX,lampY);
  const cone=ctx.createRadialGradient(lampX,lampY+4,2,lampX,lampY+32,48);
  cone.addColorStop(0,`rgba(${theme.keyRgb},.42)`);
  cone.addColorStop(1,`rgba(${theme.keyRgb},0)`);
  ctx.fillStyle=cone;
  fillPoly(ctx,[lampX-4,lampY,lampX+4,lampY,lampX+34,lampY+64,lampX-34,lampY+64]);
  ctx.fillStyle='#ffe8bd';
  ctx.beginPath();ctx.arc(lampX,lampY,3.4,0,Math.PI*2);ctx.fill();

  // Fluttering wind-blown safety ribbon along left upper post.
  ctx.strokeStyle=`rgba(${theme.keyRgb},.72)`;ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.moveTo(x+10,top+16);
  ctx.quadraticCurveTo(
   x+26,top+12+Math.sin(seconds*5.2+x)*5,
   x+42,top+18+Math.cos(seconds*4.6+x)*6,
  );
  ctx.stroke();

  // Cascading welding sparks on forge & crane high-altitude sectors (2 & 3).
  if((plan.sector===2||plan.sector===3)&&budget.tier!=='mobile'){
   for(let s=0;s<4;s++){
    const spLife=(seconds*1.35+s*0.26+x*0.004)%1;
    const sx=x+w*0.28+s*w*0.14+Math.sin(spLife*8+s)*7;
    const sy=top+22+spLife*spLife*(bottom-top-20);
    ctx.fillStyle=`rgba(255,204,112,${(1-spLife).toFixed(2)})`;
    ctx.fillRect(sx,sy,2.5,2.5);
   }
  }
 }else if(kind==='container'){
  // Security transponder LED pair + subtle rainwater drip shimmer.
  const pulseA=0.35+0.65*Math.max(0,Math.sin(seconds*3.2+x*0.02));
  const pulseB=0.35+0.65*Math.max(0,Math.sin(seconds*3.2+x*0.02+Math.PI));
  ctx.fillStyle=`rgba(110,248,255,${pulseA.toFixed(2)})`;
  ctx.fillRect(x+w-18,top+14,5,5);
  ctx.fillStyle=`rgba(${theme.keyRgb},${pulseB.toFixed(2)})`;
  ctx.fillRect(x+w-27,top+14,5,5);
  if((plan.sector===1||plan.sector===3)&&budget.tier!=='mobile'){
   const dropCycle=(seconds*1.6+x*0.01)%1;
   ctx.strokeStyle=`rgba(${theme.fillRgb},${((1-dropCycle)*0.38).toFixed(2)})`;
   ctx.lineWidth=1.2;
   const rx=x+w*(0.22+((x%5)*0.14));
   drawLine(ctx,rx,top+2+dropCycle*20,rx,top+10+dropCycle*20);
  }
 }else if(kind==='barrier'){
  // Sequential left-to-right chasing hazard road-flare strobes.
  const flares=budget.tier==='mobile'?3:5;
  const activeIdx=Math.floor(seconds*7.5)%flares;
  for(let i=0;i<flares;i++){
   const fx=x+14+i*(w-28)/Math.max(1,flares-1);
   const lit=i===activeIdx;
   ctx.fillStyle=lit?`rgba(${theme.keyRgb},.95)`:`rgba(${theme.keyRgb},.24)`;
   ctx.beginPath();ctx.arc(fx,top+5,lit?3.6:2.2,0,Math.PI*2);ctx.fill();
  }
 }

 ctx.restore();
}
