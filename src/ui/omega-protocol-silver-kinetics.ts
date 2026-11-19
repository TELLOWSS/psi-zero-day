import type {OmegaBladeStrike} from '../engine/omega-protocol-combat';
import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/**
 * Fluid visual-only animation kinematics for silver-haired AIRA V2 (384x512
 * unmirrored 8-direction sources) and expressive Diablo-style gun / 3-hit
 * energy-katana combat VFX.
 *
 * Strictly presentational: never mirrors sprites horizontally, never invents
 * projectiles or damage, and leaves native Watch collision/hitboxes intact.
 */

const SRC_W=384;
const SRC_H=512;
const HIP_Y=282;
const TORSO_OVERLAP=316;
const LEFT_HIP_X=148;
const RIGHT_HIP_X=236;
const BLADE_VISUAL_SECONDS=0.28;
const MAX_WORLD_SPEED=260;

const STRIDE_FACTOR:Readonly<Record<OmegaHeading,number>>={
 E:1.08,SE:0.96,S:0.78,SW:0.96,W:1.08,NW:0.94,N:0.76,NE:0.94,
};

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const isRearHeading=(heading:OmegaHeading)=>
 heading==='N'||heading==='NW'||heading==='NE';

export interface OmegaSmoothedVelocity {
 readonly vx:number;
 readonly vy:number;
 readonly speedRatio:number;
}

/**
 * Per-session exponential velocity smoother driven solely by Watch's
 * post-collision player world coordinates. Prevents jerky pops on start/stop.
 */
export class OmegaMotionSmoother {
 private lastPos:{x:number;y:number}|null=null;
 private lastNode:number|null=null;
 private vx=0;
 private vy=0;

 reset():void {
  this.lastPos=null;this.lastNode=null;this.vx=0;this.vy=0;
 }

 advance(
  worldX:number,worldY:number,dtSeconds:number,node:number,
 ):OmegaSmoothedVelocity {
  if(!Number.isFinite(worldX)||!Number.isFinite(worldY)||
     !Number.isFinite(dtSeconds)||dtSeconds<0||!Number.isSafeInteger(node)){
   this.reset();
   return {vx:0,vy:0,speedRatio:0};
  }
  if(this.lastPos===null||this.lastNode!==node){
   this.lastPos={x:worldX,y:worldY};
   this.lastNode=node;
   this.vx=0;this.vy=0;
   return {vx:0,vy:0,speedRatio:0};
  }
  const dx=worldX-this.lastPos.x;
  const dy=worldY-this.lastPos.y;
  const dist=Math.hypot(dx,dy);
  this.lastPos={x:worldX,y:worldY};
  if(dist>96){
   // Zone transit teleport resets velocity cleanly without a synthetic burst.
   this.vx=0;this.vy=0;
   return {vx:0,vy:0,speedRatio:0};
  }
  const dt=Math.min(0.05,dtSeconds);
  if(dt>1e-5){
   const instVx=dx/dt;
   const instVy=dy/dt;
   const decay=1-Math.exp(-dt*12);
   this.vx+=(instVx-this.vx)*decay;
   this.vy+=(instVy-this.vy)*decay;
  }
  const speed=Math.hypot(this.vx,this.vy);
  return {
   vx:this.vx,
   vy:this.vy,
   speedRatio:clamp(speed/MAX_WORLD_SPEED,0,1),
  };
 }
}

function drawLegCut(
 ctx:CanvasRenderingContext2D,
 image:CanvasImageSource,
 side:'left'|'right',
 angle:number,
 lift:number,
 strideX:number,
):void {
 const sx=side==='left'?0:SRC_W/2;
 const hipX=side==='left'?LEFT_HIP_X:RIGHT_HIP_X;
 ctx.save();
 ctx.translate(hipX+strideX,HIP_Y-lift);
 ctx.rotate(angle);
 ctx.translate(-hipX,-HIP_Y);
 ctx.drawImage(
  image,
  sx,HIP_Y,SRC_W/2,SRC_H-HIP_Y,
  sx,HIP_Y,SRC_W/2,SRC_H-HIP_Y,
 );
 ctx.restore();
}

function drawFourPointFlare(
 ctx:CanvasRenderingContext2D,
 cx:number,cy:number,
 outerR:number,innerR:number,
 rotation:number,
 color:string,
):void {
 ctx.save();
 ctx.translate(cx,cy);
 ctx.rotate(rotation);
 ctx.fillStyle=color;
 ctx.beginPath();
 for(let i=0;i<8;i++){
  const r=i%2===0?outerR:innerR;
  const a=(i*Math.PI)/4;
  if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
  else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
 }
 ctx.closePath();
 ctx.fill();
 ctx.restore();
}

function drawHandgunAndMuzzle(
 ctx:CanvasRenderingContext2D,
 heading:OmegaHeading,
 aimX:number,aimY:number,
 age:number,height:number,
 layer:'rear'|'front',
):void {
 const rear=isRearHeading(heading);
 if((layer==='rear')!==rear)return;
 const aimLen=Math.hypot(aimX,aimY);
 if(aimLen<1e-5)return;
 const angle=Math.atan2(aimY,aimX);
 const left=heading==='W'||heading==='NW'||heading==='SW';
 const gripX=height*(left?-0.17:rear?0.06:0.17);
 const gripY=-height*(rear?0.56:0.53);
 const decay=Math.max(0,1-age/0.12);
 const recoil=4.2*decay;

 ctx.save();
 ctx.translate(gripX,gripY);
 ctx.rotate(angle);
 ctx.translate(-recoil,0);

 // Silver-white sleeve cuff with violet cyber trim leading to grip.
 ctx.strokeStyle='#1b2434';ctx.lineWidth=height*0.075;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-height*0.11,height*0.04);ctx.lineTo(height*0.04,0);ctx.stroke();
 ctx.strokeStyle='#dfe5f2';ctx.lineWidth=height*0.036;
 ctx.beginPath();ctx.moveTo(-height*0.07,height*0.02);ctx.lineTo(height*0.03,-height*0.006);ctx.stroke();

 // Compact tactical plasma carbine body.
 const gunLen=height*0.24;
 const gunH=height*0.09;
 const metal=ctx.createLinearGradient(0,-gunH*0.5,gunLen,gunH*0.5);
 metal.addColorStop(0,'#e7ecf7');
 metal.addColorStop(0.45,'#7f92ad');
 metal.addColorStop(1,'#182034');
 ctx.fillStyle=metal;
 ctx.fillRect(0,-gunH*0.48,gunLen,gunH*0.75);
 ctx.fillStyle='#f47ad2';
 ctx.fillRect(gunLen*0.26,-gunH*0.56,gunLen*0.58,height*0.018);

 if(decay>0.05){
  // Layered directional plasma star-flash, shock ring, and spent energy casing.
  const mx=gunLen+height*0.03;
  ctx.globalAlpha=decay;
  const bloom=ctx.createRadialGradient(mx,0,1,mx,0,height*0.22);
  bloom.addColorStop(0,'rgba(255,252,232,.95)');
  bloom.addColorStop(0.25,'rgba(128,246,255,.78)');
  bloom.addColorStop(0.55,'rgba(196,98,255,.32)');
  bloom.addColorStop(1,'rgba(80,25,115,0)');
  ctx.fillStyle=bloom;
  ctx.beginPath();ctx.arc(mx,0,height*0.22,0,Math.PI*2);ctx.fill();
  drawFourPointFlare(ctx,mx,0,height*(0.13+0.07*decay),height*0.022,age*18,'rgba(245,253,255,.94)');
  ctx.strokeStyle='rgba(148,247,255,.75)';ctx.lineWidth=1.8;
  ctx.beginPath();ctx.ellipse(mx+height*0.04,0,height*0.024,height*0.075,0,0,Math.PI*2);ctx.stroke();
  // Ejecting golden-cyan spent shell casing arc.
  const shellProgress=clamp(age/0.11,0,1);
  const sx=gunLen*0.35-shellProgress*height*0.14;
  const sy=-height*0.05-Math.sin(shellProgress*Math.PI)*height*0.12;
  ctx.save();
  ctx.translate(sx,sy);ctx.rotate(shellProgress*7.5);
  ctx.fillStyle='#ffd98a';
  ctx.fillRect(-3,-1.5,6,3);
  ctx.restore();
 }
 ctx.restore();
}

function drawHeldEnergyKatana(
 ctx:CanvasRenderingContext2D,
 heading:OmegaHeading,
 bladeAngle:number,
 progress:number,
 combo:1|2|3,
 height:number,
 layer:'rear'|'front',
):void {
 const rear=isRearHeading(heading);
 if((layer==='rear')!==rear)return;
 const ease=1-Math.pow(1-progress,3);
 const sweepSpan=combo===3?2.45:combo===2?2.15:1.95;
 const dir=combo===2?-1:1;
 const currentAngle=bladeAngle+dir*(-sweepSpan*0.5+ease*sweepSpan);
 const alpha=clamp(1-progress*0.55,0.25,1);
 const pivotY=-height*0.52;
 const swordLen=height*(combo===3?0.66:0.56);

 ctx.save();
 ctx.translate(0,pivotY);
 ctx.rotate(currentAngle);
 ctx.globalAlpha=alpha;

 // Motion smear fan behind moving katana edge.
 ctx.strokeStyle=combo===3?'rgba(255,134,178,.42)':'rgba(128,236,255,.38)';
 ctx.lineWidth=height*0.09*(1-progress*0.5);
 ctx.beginPath();
 ctx.arc(0,0,swordLen*0.78,-dir*0.52,0,dir<0);
 ctx.stroke();

 // Metallic hilt + glowing plasma blade edge.
 ctx.strokeStyle='#182236';ctx.lineWidth=height*0.036;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(height*0.13,0);ctx.stroke();
 ctx.fillStyle='#ffd28e';ctx.fillRect(height*0.11,-height*0.04,height*0.025,height*0.08);
 const bladeGrad=ctx.createLinearGradient(height*0.13,0,swordLen,0);
 bladeGrad.addColorStop(0,'#e8fcff');
 bladeGrad.addColorStop(0.55,combo===3?'#ff98cf':'#92e9ff');
 bladeGrad.addColorStop(1,'#b57dff');
 ctx.fillStyle=bladeGrad;
 ctx.beginPath();
 ctx.moveTo(height*0.13,-height*0.024);
 ctx.lineTo(swordLen,0);
 ctx.lineTo(height*0.13,height*0.018);
 ctx.closePath();
 ctx.fill();

 ctx.restore();
}

/**
 * Articulated, fluid 8-direction renderer operating directly on genuine 384x512
 * silver-AIRA unmirrored sources. Zero horizontal scale flipping.
 */
export function drawOmegaSilverKineticActor(
 ctx:CanvasRenderingContext2D,
 image:CanvasImageSource,
 heading:OmegaHeading,
 view:OmegaActorView,
 height:number,
):boolean {
 if(!Number.isFinite(height)||height<=0)return false;
 const t=Number.isFinite(view.time)?view.time:0;
 const scale=height/SRC_H;
 const walkActive=Boolean(view.gait?.active??view.moving);
 const rawPhase=view.gait?.phase??((t*1.8)%1);
 const phase=((Number.isFinite(rawPhase)?rawPhase:0)%1+1)%1;
 const wave=walkActive?Math.sin(phase*Math.PI*2):0;

 const bladeAge=view.bladeAge;
 const slashing=typeof bladeAge==='number'&&Number.isFinite(bladeAge)&&
  bladeAge>=0&&bladeAge<=BLADE_VISUAL_SECONDS;
 const combo=view.bladeCombo??1;

 const aimX=Number.isFinite(view.weaponFacingX)?view.weaponFacingX!:view.facingX;
 const aimY=Number.isFinite(view.weaponFacingY)?view.weaponFacingY!:view.facingY;
 const firing=Boolean(view.shooting)&&!slashing&&!view.dashing&&!view.hurt&&
  !view.ultimate&&!view.finished;
 const actionAge=Math.max(0,Number.isFinite(view.actionAge)?view.actionAge??0:0);

 const speedFactor=clamp(view.speedRatio??(walkActive?0.85:0),0.35,1);
 const stride=STRIDE_FACTOR[heading]*speedFactor;
 const signLeft=(heading==='W'||heading==='NW'||heading==='SW')?-1:1;

 // Compute articulated leg swing (disabled or braced during dash/slash/hurt).
 let leftLegAngle=walkActive?wave*0.14*stride:0;
 let rightLegAngle=walkActive?-wave*0.14*stride:0;
 let leftFootLift=walkActive?Math.max(0,wave)*15*stride:0;
 let rightFootLift=walkActive?Math.max(0,-wave)*15*stride:0;
 let leftStrideX=walkActive?wave*9*stride:0;
 let rightStrideX=walkActive?-wave*9*stride:0;

 let offsetX=0;
 let offsetY=walkActive?-Math.abs(wave)*3.4:-Math.sin(t*2.2)*1.4;
 let torsoLean=walkActive?0.045*speedFactor*signLeft:0;
 let torsoTwistX=walkActive?Math.sin(phase*Math.PI*4)*1.6:0;

 if(slashing){
  const p=clamp(bladeAge/BLADE_VISUAL_SECONDS,0,1);
  const lungeCurve=Math.sin(p*Math.PI);
  const swingDir=combo===2?-1:1;
  const bx=Number.isFinite(view.bladeFacingX)?view.bladeFacingX!:view.facingX;
  const by=Number.isFinite(view.bladeFacingY)?view.bladeFacingY!:view.facingY;
  const bLen=Math.hypot(bx,by)||1;
  const lungeDist=(combo===3?15:10)*lungeCurve;
  offsetX+=(bx/bLen)*lungeDist;
  offsetY+=(by/bLen)*lungeDist*0.45-lungeCurve*4;
  torsoLean=swingDir*(0.16*lungeCurve);
  leftStrideX=10*lungeCurve*signLeft;
  rightStrideX=-12*lungeCurve*signLeft;
  leftFootLift=4*lungeCurve;
  rightFootLift=0;
 }else if(view.dashing){
  torsoLean=0.19*signLeft;
  offsetX=-8*signLeft;
  offsetY=-4;
  leftLegAngle=0.22;rightLegAngle=-0.16;
  leftStrideX=14;rightStrideX=-14;
  leftFootLift=14;rightFootLift=4;
 }else if(view.hurt){
  const hDecay=clamp(1-actionAge*3,0.2,1);
  torsoLean=-0.16*signLeft*hDecay;
  offsetX=-7*signLeft*hDecay;
  offsetY=4*hDecay;
 }else if(firing){
  const fLen=Math.hypot(aimX,aimY)||1;
  const recoilDecay=Math.max(0,1-actionAge/0.12);
  offsetX-=(aimX/fLen)*5.2*recoilDecay;
  offsetY-=(aimY/fLen)*2.4*recoilDecay;
  torsoLean-=0.06*recoilDecay*(aimX>=0?1:-1);
 }

 ctx.save();

 // 1. Dash afterimage echoes strictly along behind-motion vector (zero flip).
 if(view.dashing){
  for(let g=2;g>=1;g--){
   ctx.save();
   ctx.globalAlpha=0.14+(2-g)*0.07;
   ctx.translate(-g*14*signLeft,0);
   ctx.scale(scale,scale);
   ctx.translate(-SRC_W/2,-SRC_H);
   ctx.drawImage(image,0,0,SRC_W,SRC_H);
   ctx.restore();
  }
 }

 const bx=Number.isFinite(view.bladeFacingX)?view.bladeFacingX!:view.facingX;
 const by=Number.isFinite(view.bladeFacingY)?view.bladeFacingY!:view.facingY;
 const bladeAngle=Math.atan2(by,bx);
 const slashProgress=slashing?clamp(bladeAge/BLADE_VISUAL_SECONDS,0,1):0;

 // 2. Rear-layer weapon/blade (drawn BEHIND actor on N/NW/NE headings).
 if(slashing){
  drawHeldEnergyKatana(ctx,heading,bladeAngle,slashProgress,combo,height,'rear');
 }else if(firing){
  drawHandgunAndMuzzle(ctx,heading,aimX,aimY,actionAge,height,'rear');
 }

 // 3. Articulated lower legs & upper body from authentic unmirrored 384x512 WebP.
 ctx.save();
 if(view.hurt)ctx.globalAlpha=0.78+0.22*Math.sin(t*22)**2;
 ctx.scale(scale,scale);
 ctx.translate(-SRC_W/2+offsetX/scale,-SRC_H+offsetY/scale);
 drawLegCut(ctx,image,'left',leftLegAngle,leftFootLift,leftStrideX);
 drawLegCut(ctx,image,'right',rightLegAngle,rightFootLift,rightStrideX);
 ctx.save();
 ctx.translate(SRC_W/2,HIP_Y);
 ctx.rotate(torsoLean);
 ctx.translate(-SRC_W/2+torsoTwistX,-HIP_Y);
 ctx.drawImage(image,0,0,SRC_W,TORSO_OVERLAP,0,0,SRC_W,TORSO_OVERLAP);
 ctx.restore();
 ctx.restore();

 // 4. Front-layer weapon/blade (drawn IN FRONT of actor on side/front headings).
 if(slashing){
  drawHeldEnergyKatana(ctx,heading,bladeAngle,slashProgress,combo,height,'front');
 }else if(firing){
  drawHandgunAndMuzzle(ctx,heading,aimX,aimY,actionAge,height,'front');
 }

 ctx.restore();
 return true;
}

/**
 * Replaces bare dot muzzle glow on wide 640x512 E firing frames with an
 * anisotropic plasma star-flare, shock ring, and spent energy casing.
 */
export function drawOmegaEnhancedWideMuzzle(
 ctx:CanvasRenderingContext2D,
 muzzleX:number,
 muzzleY:number,
 height:number,
 actionAge:number,
 aimX=1,
 aimY=0,
):void {
 if(!Number.isFinite(muzzleX)||!Number.isFinite(muzzleY)||
    !Number.isFinite(height)||height<=0)
  return;
 const age=Number.isFinite(actionAge)?Math.max(0,actionAge):0;
 const decay=Math.max(0.15,1-age/0.11);
 const angle=Number.isFinite(aimX)&&Number.isFinite(aimY)&&Math.hypot(aimX,aimY)>1e-5
  ?Math.atan2(aimY,aimX):0;

 ctx.save();
 ctx.translate(muzzleX,muzzleY);
 ctx.rotate(angle);
 ctx.globalAlpha=decay;

 const glowR=height*0.18;
 const g=ctx.createRadialGradient(2,0,1,2,0,glowR);
 g.addColorStop(0,'rgba(255,253,235,.96)');
 g.addColorStop(0.28,'rgba(130,248,255,.84)');
 g.addColorStop(0.65,'rgba(195,102,255,.36)');
 g.addColorStop(1,'rgba(72,22,115,0)');
 ctx.fillStyle=g;
 ctx.beginPath();ctx.arc(2,0,glowR,0,Math.PI*2);ctx.fill();

 drawFourPointFlare(ctx,3,0,height*(0.11+0.05*decay),height*0.02,age*22,'rgba(250,255,255,.95)');
 ctx.strokeStyle='rgba(155,246,255,.78)';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(height*0.04,0,height*0.02,height*0.065,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}

/**
 * World-space 3-hit Diablo Immortal-style blade crescent smear ribbon, combo-tinted
 * aura waves, shockwave ring (Combo 3), and hit-confirmation cross spark bursts.
 */
export function drawOmegaBladeWorldSlash(
 ctx:CanvasRenderingContext2D,
 slash:OmegaBladeStrike|null|undefined,
 gameTime:number,
):void {
 if(!slash||!Number.isFinite(gameTime))return;
 const elapsed=gameTime-slash.time;
 const duration=0.25;
 if(elapsed<0||elapsed>=duration)return;

 const progress=elapsed/duration;
 const fade=1-progress;
 const angle=Math.atan2(slash.facingY,slash.facingX);
 if(!Number.isFinite(angle))return;

 const combo=slash.combo;
 const span=combo===3?1.62:combo===2?1.28:1.12;
 const dir=combo===2?-1:1;
 const outerR=(combo===3?112:96)+progress*10;

 ctx.save();
 ctx.translate(slash.x,slash.y);
 ctx.rotate(angle);

 // 1. Tapered filled crescent smear ribbon polygon.
 const steps=14;
 ctx.beginPath();
 for(let i=0;i<=steps;i++){
  const t=i/steps;
  const a=dir*(-span+t*span*2);
  ctx.lineTo(Math.cos(a)*outerR,Math.sin(a)*outerR);
 }
 for(let i=steps;i>=0;i--){
  const t=i/steps;
  const a=dir*(-span+t*span*2);
  const taper=Math.sin(t*Math.PI);
  const innerR=outerR-(20+combo*4)*taper*(0.45+0.55*fade);
  ctx.lineTo(Math.cos(a)*innerR,Math.sin(a)*innerR);
 }
 ctx.closePath();

 const fillGrad=ctx.createRadialGradient(0,0,outerR*0.45,0,0,outerR);
 if(combo===3){
  fillGrad.addColorStop(0,'rgba(255,112,162,0)');
  fillGrad.addColorStop(0.55,`rgba(222,92,248,${(.56*fade).toFixed(2)})`);
  fillGrad.addColorStop(1,`rgba(255,232,248,${(.92*fade).toFixed(2)})`);
 }else if(combo===2){
  fillGrad.addColorStop(0,'rgba(176,105,255,0)');
  fillGrad.addColorStop(0.55,`rgba(235,116,214,${(.52*fade).toFixed(2)})`);
  fillGrad.addColorStop(1,`rgba(240,248,255,${(.88*fade).toFixed(2)})`);
 }else{
  fillGrad.addColorStop(0,'rgba(92,216,255,0)');
  fillGrad.addColorStop(0.55,`rgba(116,136,255,${(.50*fade).toFixed(2)})`);
  fillGrad.addColorStop(1,`rgba(225,252,255,${(.88*fade).toFixed(2)})`);
 }
 ctx.fillStyle=fillGrad;
 ctx.fill();

 // 2. Crisp razor leading-edge highlight arc.
 ctx.strokeStyle=slash.hits>0?'rgba(255,252,255,'+(.96*fade).toFixed(2)+')':'rgba(170,234,255,'+(.72*fade).toFixed(2)+')';
 ctx.lineWidth=2.5+3*fade;
 ctx.beginPath();ctx.arc(0,0,outerR,-span,span);ctx.stroke();

 // 3. Finisher Combo-3 expanding ground shockwave ring.
 if(combo===3){
  ctx.strokeStyle=`rgba(255,148,198,${(.62*fade).toFixed(2)})`;
  ctx.lineWidth=3*fade;
  ctx.beginPath();ctx.ellipse(0,0,72+progress*52,28+progress*20,0,0,Math.PI*2);ctx.stroke();
 }

 // 4. Target impact confirmation sparks along blade arc.
 const sparkCount=slash.hits>0?5:3;
 for(let i=0;i<sparkCount;i++){
  const sa=-span*0.7+(i/(sparkCount-1))*(span*1.4);
  const sr=outerR+4+progress*16;
  const sx=Math.cos(sa)*sr,sy=Math.sin(sa)*sr;
  if(slash.hits>0&&i%2===0){
   drawFourPointFlare(ctx,sx,sy,11*fade,2.8*fade,sa,`rgba(255,244,218,${fade.toFixed(2)})`);
  }else{
   ctx.fillStyle=`rgba(228,248,255,${(.84*fade).toFixed(2)})`;
   ctx.beginPath();ctx.arc(sx,sy,2.6*fade+1,0,Math.PI*2);ctx.fill();
  }
 }

 ctx.restore();
}
