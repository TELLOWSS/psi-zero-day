import type {OmegaBladeStrike} from '../engine/omega-protocol-combat';
import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaCameraState} from './omega-protocol-camera';
import {drawOmegaPaintedMuzzleFlash} from './omega-protocol-vfx-art';

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
const HIP_Y=368;
const TORSO_OVERLAP=382;
const LEFT_HIP_X=158;
const RIGHT_HIP_X=226;
const BLADE_VISUAL_SECONDS=0.28;
const MAX_WORLD_SPEED=260;

const STRIDE_FACTOR:Readonly<Record<OmegaHeading,number>>={
 E:1.05,SE:0.95,S:0.78,SW:0.95,W:1.05,NW:0.92,N:0.76,NE:0.92,
};

const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const easeOutCubic=(t:number)=>{const k=1-clamp(t,0,1);return 1-k*k*k;};

export interface OmegaMuzzleAnchor {
 readonly u:number;
 readonly v:number;
 readonly rear:boolean;
}

/**
 * Pixel-measured gun barrel tip normalized offsets (in multiples of visualHeight)
 * for all 8 genuine 384x512 silver AIRA paintings (`foot` anchored at (0,0)).
 */
export const SILVER_AIRA_MUZZLE_ANCHORS:Readonly<Record<OmegaHeading,OmegaMuzzleAnchor>>={
 E:{u:0.295,v:-0.605,rear:false},
 SE:{u:0.255,v:-0.520,rear:false},
 S:{u:0.140,v:-0.495,rear:false},
 SW:{u:-0.245,v:-0.530,rear:false},
 W:{u:-0.300,v:-0.600,rear:false},
 NW:{u:-0.250,v:-0.630,rear:false},
 N:{u:0.100,v:-0.575,rear:true},
 NE:{u:0.245,v:-0.640,rear:false},
};

export function omegaSilverLocalMuzzle(
 heading:OmegaHeading,
 visualHeight:number,
):{readonly x:number;readonly y:number;readonly rear:boolean} {
 const anchor=SILVER_AIRA_MUZZLE_ANCHORS[heading];
 const h=Number.isFinite(visualHeight)&&visualHeight>0?visualHeight:118;
 return {x:anchor.u*h,y:anchor.v*h,rear:anchor.rear};
}

/**
 * Exact inverse 3/4 isometric matrix converting an upright actor-local offset `(ux, uy)`
 * relative to grounded foot `(anchor.x, anchor.y)` back into Watch world coordinates.
 */
export function omegaWorldPointFromUprightOffset(
 anchor:{readonly x:number;readonly y:number},
 ux:number,
 uy:number,
 camera:Pick<OmegaCameraState,'skewX'|'groundYScale'>,
):{readonly x:number;readonly y:number} {
 const invY=camera.groundYScale>0.1?1/camera.groundYScale:1;
 return {
  x:anchor.x+ux-(camera.skewX*invY)*uy,
  y:anchor.y+uy*invY,
 };
}

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

function drawSwordHandReflection(
 ctx:CanvasRenderingContext2D,
 combo:1|2|3,
 bladeAngle:number,
 progress:number,
 height:number,
 layer:'rear'|'front',
):void {
 const wantRear=Math.sin(bladeAngle)<-0.42;
 if((layer==='rear')!==wantRear)return;
 const p=clamp(progress,0,1);
 const fade=p<0.2?p/0.2:Math.pow(1-(p-0.2)/0.8,1.3);
 if(fade<=0.02)return;

 // Sweep katana blade dynamically from wind-up to follow-through across hand pivot.
 const sweepNorm=easeOutCubic(clamp(p*1.45,0,1));
 const handX=Math.cos(bladeAngle)*height*0.14;
 const handY=-height*0.52+Math.sin(bladeAngle)*height*0.08;
 const swingArc=combo===3?3.4:combo===2?-2.4:2.3;
 const startAngle=bladeAngle-swingArc*0.52;
 const curAngle=startAngle+swingArc*sweepNorm;
 const bladeLen=height*(combo===3?0.68:0.56);
 const tipX=handX+Math.cos(curAngle)*bladeLen;
 const tipY=handY+Math.sin(curAngle)*bladeLen*0.72;
 const rgb=combo===3?'251,191,36':combo===2?'192,132,252':'103,232,249';

 ctx.save();
 ctx.globalCompositeOperation='lighter';

 // 1. Sweeping energy katana trail arc from shoulder/hand pivot.
 const arcR=bladeLen*0.86;
 const trailStart=swingArc>0?Math.max(startAngle,curAngle-1.25):startAngle;
 const trailEnd=swingArc>0?curAngle:Math.min(startAngle,curAngle+1.25);
 ctx.save();
 ctx.translate(handX,handY);
 ctx.scale(1,0.72);
 ctx.strokeStyle=`rgba(${rgb},${(0.46*fade).toFixed(3)})`;
 ctx.lineWidth=(combo===3?16:12)*fade+2;
 ctx.lineCap='round';
 ctx.beginPath();
 ctx.arc(0,0,arcR,trailStart,trailEnd,swingArc<0);
 ctx.stroke();
 ctx.restore();

 // 2. Razor-sharp physical plasma katana blade + hot white edge core.
 ctx.strokeStyle=`rgba(${rgb},${(0.92*fade).toFixed(3)})`;
 ctx.lineWidth=(combo===3?5.8:4.4)*fade+1.5;
 ctx.lineCap='round';
 ctx.beginPath();
 ctx.moveTo(handX,handY);
 ctx.lineTo(tipX,tipY);
 ctx.stroke();

 ctx.strokeStyle=`rgba(255,255,255,${(0.96*fade).toFixed(3)})`;
 ctx.lineWidth=(combo===3?2.4:1.8)*fade+0.6;
 ctx.beginPath();
 ctx.moveTo(handX,handY);
 ctx.lineTo(tipX,tipY);
 ctx.stroke();

 // 3. Energy hilt & tip flare.
 const grad=ctx.createRadialGradient(handX,handY,1,handX,handY,height*0.17);
 grad.addColorStop(0,`rgba(255,255,255,${(0.62*fade).toFixed(3)})`);
 grad.addColorStop(0.45,`rgba(${rgb},${(0.42*fade).toFixed(3)})`);
 grad.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=grad;
 ctx.beginPath();ctx.arc(handX,handY,height*0.17,0,Math.PI*2);ctx.fill();
 drawFourPointFlare(ctx,tipX,tipY,10*fade,2.5*fade,curAngle,`rgba(255,250,235,${fade.toFixed(2)})`);
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
 const plantPulse=walkActive?Math.pow(Math.max(0,Math.cos(phase*Math.PI*2)),4):0;

 const bladeAge=view.bladeAge;
 const slashing=typeof bladeAge==='number'&&Number.isFinite(bladeAge)&&
  bladeAge>=0&&bladeAge<=BLADE_VISUAL_SECONDS;
 const combo=view.bladeCombo??1;

 const aimX=Number.isFinite(view.weaponFacingX)?view.weaponFacingX!:view.facingX;
 const aimY=Number.isFinite(view.weaponFacingY)?view.weaponFacingY!:view.facingY;
 const firing=Boolean(view.shooting)&&!slashing&&!view.dashing&&!view.hurt&&
  !view.ultimate&&!view.finished;
 const actionAge=Math.max(0,Number.isFinite(view.actionAge)?view.actionAge??0:0);

 const speedFactor=clamp(view.speedRatio??(walkActive?0.85:0),0.3,1);
 const stride=STRIDE_FACTOR[heading]*speedFactor;
 const signLeft=(heading==='W'||heading==='NW'||heading==='SW')?-1:1;
 const velLean=Number.isFinite(view.velocityX)?clamp((view.velocityX??0)/260,-1,1)*0.058:0.04*speedFactor*signLeft;

 // Subtle cohesive boot stride keeping coat & waist 100% seamless.
 let leftLegAngle=walkActive?wave*0.055*stride:0;
 let rightLegAngle=walkActive?-wave*0.055*stride:0;
 let leftFootLift=walkActive?Math.max(0,wave)*6.5*stride:0;
 let rightFootLift=walkActive?Math.max(0,-wave)*6.5*stride:0;
 let leftStrideX=walkActive?wave*4.5*stride:0;
 let rightStrideX=walkActive?-wave*4.5*stride:0;

 let offsetX=0;
 let offsetY=walkActive?-Math.abs(wave)*2.8-speedFactor*0.8:-Math.sin(t*2.4)*1.1;
 let torsoLean=walkActive?velLean:Math.sin(t*1.8)*0.008;
 const torsoTwistX=walkActive?Math.sin(phase*Math.PI*2)*0.9:0;
 let squashX=walkActive?1+plantPulse*0.022:1;
 let squashY=walkActive?1-plantPulse*0.018:1;

 if(slashing){
  const p=clamp(bladeAge/BLADE_VISUAL_SECONDS,0,1);
  const lungeCurve=Math.sin(p*Math.PI);
  const bx=Number.isFinite(view.bladeFacingX)?view.bladeFacingX!:view.facingX;
  const by=Number.isFinite(view.bladeFacingY)?view.bladeFacingY!:view.facingY;
  const bLen=Math.hypot(bx,by)||1;
  const dirSign=(bx/bLen)>=0?1:-1;
  const lungeDist=(combo===3?22:14)*lungeCurve;
  offsetX+=(bx/bLen)*lungeDist;
  offsetY+=(by/bLen)*lungeDist*0.42-lungeCurve*5;
  torsoLean=dirSign*(combo===3?0.22:0.16)*lungeCurve;
  leftStrideX=6*lungeCurve*dirSign;
  rightStrideX=-7*lungeCurve*dirSign;
  leftFootLift=3*lungeCurve;
  rightFootLift=0;
  squashX=1+0.045*lungeCurve;
  squashY=1-0.038*lungeCurve;
 }else if(view.dashing){
  torsoLean=0.17*signLeft;
  offsetX=-6*signLeft;
  offsetY=-3;
  leftLegAngle=0.12;rightLegAngle=-0.10;
  leftStrideX=8;rightStrideX=-8;
  leftFootLift=9;rightFootLift=3;
  squashX=1.06;squashY=0.94;
 }else if(view.hurt){
  const hDecay=clamp(1-actionAge*3,0.2,1);
  torsoLean=-0.14*signLeft*hDecay;
  offsetX=-6*signLeft*hDecay;
  offsetY=3*hDecay;
  squashX=0.95;squashY=1.04;
 }else if(firing){
  const fLen=Math.hypot(aimX,aimY)||1;
  const recoilDecay=Math.max(0,1-actionAge/0.11);
  offsetX-=(aimX/fLen)*4.2*recoilDecay;
  offsetY-=(aimY/fLen)*2.0*recoilDecay;
  torsoLean-=0.045*recoilDecay*(aimX>=0?1:-1);
 }

 ctx.save();

 // 1. Dash / slash lunge afterimage echoes strictly along behind-motion vector (zero flip).
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
 }else if(slashing){
  const p=clamp(bladeAge/BLADE_VISUAL_SECONDS,0,1);
  const lungeCurve=Math.sin(p*Math.PI);
  const bxDir=Number.isFinite(view.bladeFacingX)?view.bladeFacingX!:view.facingX;
  const byDir=Number.isFinite(view.bladeFacingY)?view.bladeFacingY!:view.facingY;
  const bLen=Math.hypot(bxDir,byDir)||1;
  ctx.save();
  ctx.globalAlpha=0.22*lungeCurve;
  ctx.translate(-(bxDir/bLen)*16*lungeCurve,-(byDir/bLen)*6*lungeCurve);
  ctx.scale(scale,scale);
  ctx.translate(-SRC_W/2,-SRC_H);
  ctx.drawImage(image,0,0,SRC_W,SRC_H);
  ctx.restore();
 }

 const bx=Number.isFinite(view.bladeFacingX)?view.bladeFacingX!:view.facingX;
 const by=Number.isFinite(view.bladeFacingY)?view.bladeFacingY!:view.facingY;
 const bladeAngle=Math.atan2(by,bx);
 const slashProgress=slashing?clamp(bladeAge/BLADE_VISUAL_SECONDS,0,1):0;
 const aimAngle=Math.hypot(aimX,aimY)>1e-5?Math.atan2(aimY,aimX):0;
 const muzzle=omegaSilverLocalMuzzle(heading,height);

 // 2. Rear-layer VFX ONLY when weapon/slash sits behind AIRA (e.g., N heading).
 if(slashing){
  drawSwordHandReflection(ctx,combo,bladeAngle,slashProgress,height,'rear');
 }else if(firing&&muzzle.rear){
  drawOmegaPaintedMuzzleFlash(
   ctx,
   muzzle.x+offsetX,
   muzzle.y+offsetY,
   aimAngle,
   height/118,
   actionAge,
  );
 }

 // 3. Seamless cohesive 3-part lower-boot & intact upper-coat draw (zero flip).
 ctx.save();
 if(view.hurt)ctx.globalAlpha=0.78+0.22*Math.sin(t*22)**2;
 ctx.scale(scale*squashX,scale*squashY);
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

 // 4. Front-layer VFX at exact painted barrel pixel or sweeping katana blade.
 if(slashing){
  drawSwordHandReflection(ctx,combo,bladeAngle,slashProgress,height,'front');
 }else if(firing&&!muzzle.rear){
  drawOmegaPaintedMuzzleFlash(
   ctx,
   muzzle.x+offsetX,
   muzzle.y+offsetY,
   aimAngle,
   height/118,
   actionAge,
  );
 }

 ctx.restore();
 return true;
}

/**
 * Replaces bare dot muzzle glow on wide 640x512 E firing frames with the
 * painterly additive supersonic plasma burst anchored directly at g5j muzzle pixels.
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
 const angle=Number.isFinite(aimX)&&Number.isFinite(aimY)&&Math.hypot(aimX,aimY)>1e-5
  ?Math.atan2(aimY,aimX):0;
 drawOmegaPaintedMuzzleFlash(ctx,muzzleX,muzzleY,angle,height/128,age);
}

export interface OmegaBallisticTracerVisual {
 readonly visualX:number;
 readonly visualY:number;
 readonly groundX:number;
 readonly groundY:number;
 readonly spawnX:number;
 readonly spawnY:number;
 readonly age:number;
}

interface TrackedProjectileRecord {
 readonly spawnX:number;
 readonly spawnY:number;
 readonly originX:number;
 readonly originY:number;
 readonly bornAt:number;
}

/**
 * Visual-only projectile origin tracker: keeps Watch collision `(x, y)` untouched
 * while making bullets visibly launch directly out of AIRA's painted gun barrel tip
 * and smoothly travel along chest height above their ground shadow.
 */
export class OmegaBallisticTracerTracker {
 private readonly seen=new Map<string,TrackedProjectileRecord>();

 reset():void {
  this.seen.clear();
 }

 sync(
  projectiles:readonly {readonly id:string;readonly x:number;readonly y:number}[],
  muzzleWorld:{readonly x:number;readonly y:number},
  gameTime:number,
 ):void {
  const activeIds=new Set<string>();
  const now=Number.isFinite(gameTime)?gameTime:0;
  for(const p of projectiles){
   activeIds.add(p.id);
   if(!this.seen.has(p.id)){
    const sx=Number.isFinite(muzzleWorld.x)?muzzleWorld.x:p.x;
    const sy=Number.isFinite(muzzleWorld.y)?muzzleWorld.y:p.y;
    this.seen.set(p.id,{
     spawnX:sx,
     spawnY:sy,
     originX:p.x,
     originY:p.y,
     bornAt:now,
    });
   }
  }
  for(const id of this.seen.keys()){
   if(!activeIds.has(id))this.seen.delete(id);
  }
 }

 resolveVisual(
  projectile:{readonly id:string;readonly x:number;readonly y:number},
  camera:Pick<OmegaCameraState,'skewX'|'groundYScale'>,
  gameTime:number,
 ):OmegaBallisticTracerVisual {
  const chestOffset=omegaWorldPointFromUprightOffset({x:0,y:0},0,-48,camera);
  const chestX=projectile.x+chestOffset.x;
  const chestY=projectile.y+chestOffset.y;
  const rec=this.seen.get(projectile.id);
  if(!rec){
   return {
    visualX:chestX,
    visualY:chestY,
    groundX:projectile.x,
    groundY:projectile.y,
    spawnX:chestX,
    spawnY:chestY,
    age:1,
   };
  }
  const age=Math.max(0,(Number.isFinite(gameTime)?gameTime:rec.bornAt)-rec.bornAt);
  const dx=projectile.x-rec.originX;
  const dy=projectile.y-rec.originY;
  const travel=Math.hypot(dx,dy);
  const blend=easeOutCubic(clamp(Math.max(age/0.065,travel/55),0,1));
  const muzzlePlusX=rec.spawnX+dx;
  const muzzlePlusY=rec.spawnY+dy;
  return {
   visualX:muzzlePlusX+(chestX-muzzlePlusX)*blend,
   visualY:muzzlePlusY+(chestY-muzzlePlusY)*blend,
   groundX:projectile.x,
   groundY:projectile.y,
   spawnX:rec.spawnX,
   spawnY:rec.spawnY,
   age,
  };
 }
}

/**
 * Renders an elevated supersonic plasma tracer round with a matching ground contact shadow
 * and a brief barrel-to-bolt muzzle exit beam during the initial 55ms of flight.
 */
export function drawOmegaBallisticProjectile(
 ctx:CanvasRenderingContext2D,
 visual:OmegaBallisticTracerVisual,
 radius:number,
 vx:number,
 vy:number,
 isEnemy=false,
):void {
 if(
  !Number.isFinite(visual.visualX)||!Number.isFinite(visual.visualY)||
  !Number.isFinite(visual.groundX)||!Number.isFinite(visual.groundY)||
  !(radius>0)
 )return;

 const speed=Math.hypot(vx,vy);
 const ux=speed>1e-4?vx/speed:1;
 const uy=speed>1e-4?vy/speed:0;
 const boltLen=clamp(18+radius*2.2,18,34);
 const boltWidth=clamp(radius*0.62,2.2,4.4);
 const colorRgb=isEnemy?'255,108,158':'114,232,255';

 ctx.save();

 // 1. Ground shadow directly at unmodified Watch projectile coordinates.
 ctx.fillStyle='rgba(2,8,16,.38)';
 ctx.beginPath();
 ctx.ellipse(visual.groundX,visual.groundY,radius*1.45,Math.max(2.5,radius*0.52),0,0,Math.PI*2);
 ctx.fill();

 // 2. Barrel-to-bolt supersonic plasma launch bridge in first 55ms.
 if(!isEnemy&&visual.age>=0&&visual.age<0.055){
  const beamFade=1-visual.age/0.055;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const bGrad=ctx.createLinearGradient(visual.spawnX,visual.spawnY,visual.visualX,visual.visualY);
  bGrad.addColorStop(0,'rgba(255,255,255,0)');
  bGrad.addColorStop(0.35,`rgba(${colorRgb},${(0.45*beamFade).toFixed(3)})`);
  bGrad.addColorStop(1,`rgba(255,255,255,${(0.92*beamFade).toFixed(3)})`);
  ctx.strokeStyle=bGrad;
  ctx.lineWidth=2.6*beamFade+0.8;
  ctx.beginPath();
  ctx.moveTo(visual.spawnX,visual.spawnY);
  ctx.lineTo(visual.visualX,visual.visualY);
  ctx.stroke();
  ctx.restore();
 }

 // 3. Additive supersonic plasma bolt + ionization wake at chest height.
 ctx.globalCompositeOperation='lighter';
 const tailX=visual.visualX-ux*boltLen;
 const tailY=visual.visualY-uy*boltLen;
 const wake=ctx.createLinearGradient(tailX,tailY,visual.visualX+ux*4,visual.visualY+uy*4);
 wake.addColorStop(0,`rgba(${colorRgb},0)`);
 wake.addColorStop(0.55,`rgba(${colorRgb},.78)`);
 wake.addColorStop(1,'rgba(255,255,255,.98)');
 ctx.strokeStyle=wake;
 ctx.lineWidth=boltWidth*1.45;
 ctx.lineCap='round';
 ctx.beginPath();
 ctx.moveTo(tailX,tailY);
 ctx.lineTo(visual.visualX+ux*4,visual.visualY+uy*4);
 ctx.stroke();

 const headGlow=ctx.createRadialGradient(
  visual.visualX,visual.visualY,0,
  visual.visualX,visual.visualY,radius*2.6,
 );
 headGlow.addColorStop(0,'rgba(255,255,255,.98)');
 headGlow.addColorStop(0.35,`rgba(${colorRgb},.72)`);
 headGlow.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=headGlow;
 ctx.beginPath();
 ctx.arc(visual.visualX,visual.visualY,radius*2.6,0,Math.PI*2);
 ctx.fill();

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
