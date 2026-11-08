import type {OmegaHeading,OmegaActorView} from './omega-protocol-actor-render';

/**
 * AIRA V2's ORIGINAL hand-anchored tactical sidearm overlay.
 * Fires ONLY during genuine Watch shot feedback; the projectile physics,
 * timing, range, hitboxes and gun damage are not created here.
 * This is a temporary visual bridge, NOT a painted firing animation.
 */
const ALLOWED_SHOT_AGE=.095;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export interface OmegaV2ShotFrame{
 readonly directionRadians:number;
 readonly recoil:number;
 readonly intensity:number;
 readonly gripX:number;
 readonly gripY:number;
 readonly drawn:boolean;
}
export function omegaAiraV2ShotFrame(
 view:OmegaActorView,heading:OmegaHeading,visualHeight:number,
):OmegaV2ShotFrame{
 const aimX=Number.isFinite(view.weaponFacingX)?view.weaponFacingX!:view.facingX;
 const aimY=Number.isFinite(view.weaponFacingY)?view.weaponFacingY!:view.facingY;
 const bearing=Math.hypot(aimX,aimY);
 const age=Number.isFinite(view.actionAge)?Math.max(0,view.actionAge??0):0;
 const draw=Boolean(view.shooting)&&!view.hurt&&!view.finished&&!view.dashing&&
  bearing>1e-5&&Number.isFinite(visualHeight)&&visualHeight>0&&
  age<=ALLOWED_SHOT_AGE;
 const left=heading==='W'||heading==='NW'||heading==='SW';
 const rear=heading==='N'||heading==='NW'||heading==='NE';
 const width=visualHeight*192/336;
 return {
  directionRadians:bearing>0?Math.atan2(aimY,aimX):0,
  recoil:draw?3.7*Math.max(0,1-age/ALLOWED_SHOT_AGE):0,
  intensity:draw?clamp(1-age/ALLOWED_SHOT_AGE,.18,1):0,
  gripX:width*(left?-.25:rear?.08:.25),
  gripY:-visualHeight*(rear?.55:.52),
  drawn:draw,
 };
}
function line(ctx:CanvasRenderingContext2D,points:readonly (readonly [number,number])[]):void{
 ctx.beginPath();
 for(const [i,p] of points.entries())if(i===0)ctx.moveTo(...p);else ctx.lineTo(...p);
 ctx.stroke();
}
/**
 * All painting stays within the existing actor canvas transform. The weapon's
 * barrel follows real launch bearing, including a shot in the opposite
 * direction to AIRA's body. No new enemy entities or simulated bullets.
 */
export function drawOmegaAiraV2ShotVfx(
 ctx:CanvasRenderingContext2D,view:OmegaActorView,
 heading:OmegaHeading,height:number,
):void{
 const pose=omegaAiraV2ShotFrame(view,heading,height);
 if(!pose.drawn)return;
 ctx.save();
 ctx.translate(pose.gripX,pose.gripY);
 ctx.rotate(pose.directionRadians);
 ctx.translate(-pose.recoil,0);
 // Black sleeve with white composite armor and magenta cuffs.
 ctx.strokeStyle='#1c2736';ctx.lineWidth=11;ctx.lineCap='round';
 line(ctx,[[-17,10],[-5,2],[8,0]]);
 ctx.strokeStyle='#dbe0ef';ctx.lineWidth=4.5;
 line(ctx,[[-10,6],[-2,1],[7,-1]]);
 ctx.strokeStyle='#f47bc5';ctx.lineWidth=2.1;
 line(ctx,[[-8,8],[-2,3],[3,2]]);
 // Distinctive compact Omega tactical sidearm, not a generic grey bar.
 const metal=ctx.createLinearGradient(0,-8,0,9);
 metal.addColorStop(0,'#e3e3ed');
 metal.addColorStop(.30,'#8398ae');
 metal.addColorStop(.65,'#27324b');
 metal.addColorStop(1,'#111729');
 ctx.fillStyle=metal;
 ctx.beginPath();ctx.moveTo(4,-8);ctx.lineTo(30,-9);
 ctx.lineTo(35,-4);ctx.lineTo(35,5);ctx.lineTo(25,7);
 ctx.lineTo(5,6);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#11192c';ctx.lineWidth=1.4;ctx.stroke();
 ctx.fillStyle='#ff7cd4';ctx.fillRect(13,-10,19,3);
 ctx.fillStyle='#f4d5a0';ctx.fillRect(24,-6,5,2);
 ctx.fillStyle='#141c2e';ctx.fillRect(6,6,8,11);
 ctx.fillStyle='#f9c476';ctx.fillRect(7,8,3,4);
 ctx.strokeStyle='#f6b6db';ctx.lineWidth=1;
 line(ctx,[[5,-7],[13,-7],[13,3]]);
 // Actual native shot flash; does not invent a projectile or damage.
 ctx.globalAlpha=pose.intensity;
 const g=ctx.createRadialGradient(37,0,1,37,0,23);
 g.addColorStop(0,'rgba(255,252,222,.93)');
 g.addColorStop(.17,'rgba(255,123,229,.90)');
 g.addColorStop(.48,'rgba(190,75,245,.36)');
 g.addColorStop(1,'rgba(88,30,113,0)');
 ctx.fillStyle=g;ctx.fillRect(14,-24,47,48);
 ctx.strokeStyle='#ffbbed';ctx.lineWidth=2.6;
 line(ctx,[[35,0],[53,-8],[46,-2],[59,1]]);
 line(ctx,[[36,0],[53,7],[49,3],[62,2]]);
 ctx.fillStyle='#fff8ea';ctx.beginPath();ctx.arc(36,0,4,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
