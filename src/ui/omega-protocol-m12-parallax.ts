import type {OmegaFieldPlan,OmegaFieldObstacle} from '../domain/omega-protocol-field';
import {
 omegaQuarterViewCamera,type OmegaCameraState,
} from './omega-protocol-camera';

/**
 * M12-G3: real camera-follow parallax + steel-safety mesh.
 * Presentation-only for the first night-yard sector. Never alters native
 * Watch collision, projectile line-of-sight, hazard damage, save or unlock.
 * All artwork is generated from original vector geometry on the local canvas.
 */
export interface OmegaG3Budget {
 readonly tier:'mobile'|'medium'|'high';
 readonly distantBeams:number;
 readonly meshPitch:number;
 readonly luminous:boolean;
}
export function omegaG3Budget(width:number,height:number):OmegaG3Budget{
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)
  throw new RangeError('Invalid G3 viewport');
 const pixels=width*height;
 return pixels<=380_000?
  {tier:'mobile',distantBeams:5,meshPitch:26,luminous:false}:
  pixels<=850_000?
   {tier:'medium',distantBeams:9,meshPitch:18,luminous:false}:
   {tier:'high',distantBeams:14,meshPitch:12,luminous:true};
}
export type OmegaG3ParallaxPlane='far'|'mid'|'near';
export const OMEGA_G3_DEPTH_RATIO:Readonly<Record<OmegaG3ParallaxPlane,number>>={
 far:.16,mid:.48,near:.78,
};
export interface OmegaG3Shift{readonly dx:number;readonly dy:number;}
const clamp=(v:number,b:number)=>Math.max(-b,Math.min(b,v));
/** Measurable independent parallax using the SAME followed native camera. */
export function omegaG3ParallaxShift(
 camera:OmegaCameraState,entryCamera:OmegaCameraState,
 layer:OmegaG3ParallaxPlane,
):OmegaG3Shift{
 for(const v of [camera.scale,camera.projectedOffsetX,camera.projectedOffsetY,
                  entryCamera.scale,entryCamera.projectedOffsetX,entryCamera.projectedOffsetY])
  if(!Number.isFinite(v))throw new RangeError('Nonfinite parallax camera');
 const k=OMEGA_G3_DEPTH_RATIO[layer];
 return {
  dx:clamp((camera.projectedOffsetX-entryCamera.projectedOffsetX)*camera.scale*k,100),
  dy:clamp((camera.projectedOffsetY-entryCamera.projectedOffsetY)*camera.scale*k,55),
 };
}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number):void{
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function polygon(ctx:CanvasRenderingContext2D,p:readonly number[]):void{
 ctx.beginPath();ctx.moveTo(p[0]!,p[1]!);
 for(let i=2;i<p.length;i+=2)ctx.lineTo(p[i]!,p[i+1]!);
 ctx.closePath();ctx.fill();
}
/**
 * Original three independent full-viewport architecture planes.
 * Screen-space (not a misleading extra native blocking prop) atop the
 * original ground but BELOW all Watch hazards, player and game HUD.
 * Clips to upper atmosphere and extreme lateral margins for combat clarity.
 */
export function drawOmegaG3ParallaxArchitecture(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 camera:OmegaCameraState,width:number,height:number,zoom:number,
 budget:OmegaG3Budget,
):void{
 if(plan.sector!==1||!Number.isFinite(zoom)||zoom<1||zoom>2.5)return;
 const baseline=omegaQuarterViewCamera(plan.entry,width,height,zoom);
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 // FAR: a muted structural night skyline beyond the native arena.
 const far=omegaG3ParallaxShift(camera,baseline,'far');
 ctx.save();ctx.beginPath();ctx.rect(0,0,width,height*.27);ctx.clip();
 ctx.translate(far.dx,far.dy);
 const gradient=ctx.createLinearGradient(0,0,0,height*.28);
 gradient.addColorStop(0,'rgba(36,74,101,.42)');
 gradient.addColorStop(1,'rgba(13,32,51,0)');
 ctx.fillStyle=gradient;ctx.fillRect(-140,0,width+280,height*.26);
 ctx.strokeStyle='rgba(127,178,196,.34)';ctx.lineWidth=Math.max(1.5,width*.0016);
 for(let i=0;i<budget.distantBeams;i++){
  const x=-45+i*(width+90)/(budget.distantBeams-1);
  line(ctx,x,0,x+height*.045,height*.255);
  line(ctx,x+height*.045,height*.255,x+height*.10,0);
 }
 ctx.strokeStyle='rgba(143,179,190,.30)';ctx.lineWidth=3;
 line(ctx,-55,height*.18,width+65,height*.18);
 line(ctx,-55,height*.11,width+65,height*.11);
 ctx.restore();
 // MID: asymmetrical hanging gantry and upper riveted steel bands.
 const mid=omegaG3ParallaxShift(camera,baseline,'mid');
 ctx.save();ctx.beginPath();ctx.rect(0,0,width,height*.29);ctx.clip();
 ctx.translate(mid.dx,mid.dy);
 const top=height*.035,back=height*.13;
 const bg=ctx.createLinearGradient(0,top,0,back);
 bg.addColorStop(0,'rgba(98,143,161,.40)');
 bg.addColorStop(1,'rgba(21,48,68,.67)');
 ctx.fillStyle=bg;
 polygon(ctx,[-105,top,width+105,top+height*.02,width+105,back,-105,back-height*.01]);
 ctx.strokeStyle='rgba(161,205,210,.52)';ctx.lineWidth=2;
 line(ctx,-70,top+3,width+70,top+height*.023);
 line(ctx,-70,back,width+70,back+height*.011);
 ctx.strokeStyle='rgba(246,177,97,.40)';ctx.lineWidth=2.5;
 line(ctx,width*.04,back-3,width*.42,back+height*.004);
 for(let i=0;i<Math.max(4,Math.floor(budget.distantBeams*.75));i++){
  const x=i*width/Math.max(3,Math.floor(budget.distantBeams*.75)-1);
  ctx.strokeStyle='rgba(155,208,218,.31)';ctx.lineWidth=2;
  line(ctx,x,top,x+width*.035,back);
  line(ctx,x+width*.035,top+height*.01,x,back);
 }
 ctx.restore();
 // NEAR: one side-mask on each side, never a full-width opaque roof.
 const near=omegaG3ParallaxShift(camera,baseline,'near');
 ctx.save();ctx.beginPath();
 ctx.rect(0,0,width*.125,height*.51);
 ctx.rect(width*.875,0,width*.125,height*.51);
 ctx.clip();ctx.translate(near.dx,near.dy);
 const girder=ctx.createLinearGradient(0,0,width*.14,0);
 girder.addColorStop(0,'rgba(8,23,39,.84)');
 girder.addColorStop(1,'rgba(73,113,133,.60)');
 ctx.fillStyle=girder;
 polygon(ctx,[-55,-15,width*.095,-15,width*.18,height*.39,width*.13,height*.43]);
 ctx.fillStyle='rgba(18,42,60,.79)';
 polygon(ctx,[width*.91,-20,width+70,-20,width+65,height*.52,width*.87,height*.45]);
 ctx.strokeStyle='rgba(175,212,221,.42)';ctx.lineWidth=4;
 line(ctx,width*.07,0,width*.17,height*.42);
 line(ctx,width*.935,0,width*.89,height*.44);
 if(budget.luminous){
  ctx.strokeStyle='rgba(255,189,105,.32)';ctx.lineWidth=2;
  line(ctx,width*.082,height*.08,width*.118,height*.27);
 }
 ctx.restore();
 ctx.restore();
}
/** Decorative cutaway steel lattice only inside actual colliding structure. */
export function drawOmegaG3NativeMesh(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
 obstacle:OmegaFieldObstacle,budget:OmegaG3Budget,
):void{
 if(plan.sector!==1||!plan.obstacles.includes(obstacle)||
    (obstacle.kind!=='scaffold'&&obstacle.kind!=='machine'))return;
 const {x,y,width:w,height:h}=obstacle;
 const top=y-(obstacle.kind==='scaffold'?95:80);
 const end=y+h;
 ctx.save();ctx.beginPath();ctx.rect(x+5,top+8,w-10,end-top-12);ctx.clip();
 ctx.strokeStyle='rgba(146,209,211,.20)';ctx.lineWidth=1;
 for(let xx=x-w;xx<x+w*2;xx+=budget.meshPitch){
  line(ctx,xx,top,xx+(end-top)*.55,end);
  line(ctx,xx,end,xx+(end-top)*.55,top);
 }
 ctx.strokeStyle='rgba(245,192,104,.68)';ctx.lineWidth=2;
 line(ctx,x+7,top+12,x+w-7,top+12);
 ctx.restore();
}
