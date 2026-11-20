import type {OmegaFieldPoint} from '../domain/omega-protocol-field';

/**
 * Physical-trajectory afterimages for the OMEGA character. An echo is emitted
 * only when the native Watch player really moves while dashing. This is not an
 * attack, hitbox, independent actor, or substitute for approved AIRA sprites.
 */
export interface OmegaDashEcho extends OmegaFieldPoint {
 readonly time:number;
 readonly facingX:number;
 readonly facingY:number;
}
export const OMEGA_DASH_ECHO_LIFETIME=.19;
export const OMEGA_MAX_DASH_ECHOES=5;
const MIN_GAP=18;
const finite=(v:number)=>Number.isFinite(v);
export function omegaAdvanceDashEchoes(
 previous:readonly OmegaDashEcho[],player:OmegaFieldPoint,
 previousPlayer:OmegaFieldPoint,facing:OmegaFieldPoint,nativeDash:boolean,gameTime:number,
 active:boolean,
):readonly OmegaDashEcho[]{
 if(!finite(player.x)||!finite(player.y)||!finite(previousPlayer.x)||!finite(previousPlayer.y)||
    !finite(gameTime)||gameTime<0||
    !finite(facing.x)||!finite(facing.y)||!active)return [];
 const keep=previous.filter(e=>gameTime>=e.time&&gameTime-e.time<OMEGA_DASH_ECHO_LIFETIME);
 if(!nativeDash||Math.hypot(player.x-previousPlayer.x,player.y-previousPlayer.y)<2)return keep;
 const last=keep.at(-1);
 if(last&&Math.hypot(player.x-last.x,player.y-last.y)<MIN_GAP)return keep;
 return [...keep,{x:player.x,y:player.y,time:gameTime,
  facingX:facing.x,facingY:facing.y}].slice(-OMEGA_MAX_DASH_ECHOES);
}
export function omegaDashEchoOpacity(echo:OmegaDashEcho,time:number):number{
 if(!Number.isFinite(time)||time<echo.time||time>=echo.time+OMEGA_DASH_ECHO_LIFETIME)
  return 0;
 const lifetime=(time-echo.time)/OMEGA_DASH_ECHO_LIFETIME;
 return Math.max(0,(1-lifetime)**1.35*.38);
}
/**
 * Small original ground-only neon smear, aligned to REAL dash positions.
 * Draw before heroes and hazards in the same quarter-view transform.
 */
export function drawOmegaDashEnergy(
 ctx:CanvasRenderingContext2D,
 echoes:readonly OmegaDashEcho[],now:number,
):void{
 if(!Number.isFinite(now))return;
 for(const echo of echoes){
  const opacity=omegaDashEchoOpacity(echo,now);
  if(opacity<=0)continue;
  const angle=Math.atan2(echo.facingY||0,echo.facingX||1);
  ctx.save();
  ctx.translate(echo.x,echo.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation='lighter';
  const aura=ctx.createRadialGradient?.(-6,0,2,-6,0,42);
  if(aura&&typeof aura.addColorStop==='function'){
   aura.addColorStop(0,`rgba(164,244,255,${(opacity*1.2).toFixed(3)})`);
   aura.addColorStop(0.45,`rgba(196,118,255,${(opacity*0.72).toFixed(3)})`);
   aura.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=aura;
  }else{
   ctx.globalAlpha=opacity;
   ctx.fillStyle='#a4f4ff';
  }
  ctx.beginPath();ctx.ellipse(-6,0,40,12,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(141,230,255,${(opacity*1.35).toFixed(3)})`;
  ctx.lineWidth=1.8;
  ctx.beginPath();ctx.ellipse(2,0,28,7,0,0,Math.PI*2);ctx.stroke();

  // Holographic directional warp chevrons + sleek slipstream streaks along dash vector.
  ctx.strokeStyle=`rgba(216,250,255,${(opacity*1.45).toFixed(3)})`;
  ctx.lineWidth=2.0;
  ctx.lineCap='round';
  for(const cx of [-22,-6]){
   ctx.beginPath();
   ctx.moveTo(cx-6,-9);ctx.lineTo(cx+4,0);ctx.lineTo(cx-6,9);
   ctx.stroke();
  }
  ctx.strokeStyle=`rgba(192,132,252,${(opacity*1.15).toFixed(3)})`;
  ctx.lineWidth=1.4;
  ctx.beginPath();
  ctx.moveTo(-40,-5);ctx.lineTo(-10,-5);
  ctx.moveTo(-36,5);ctx.lineTo(-8,5);
  ctx.stroke();
  ctx.restore();
 }
}
/** A small boot splash at the native grounded-gait contact event.
 * The contact coordinates come from measured feet, never a timer effect.
 */
export function drawOmegaGroundedSplash(
 ctx:CanvasRenderingContext2D,
 contacts:readonly {x:number;y:number;landed?:boolean}[],
 time:number,
):void {
 if(!Number.isFinite(time))return;
 for(const contact of contacts){
  if(!contact.landed||!finite(contact.x)||!finite(contact.y))continue;
  ctx.save();ctx.translate(contact.x,contact.y);
  ctx.strokeStyle='rgba(208,242,255,0.48)';
  ctx.fillStyle='rgba(232,248,255,0.62)';
  ctx.lineWidth=1.1;
  ctx.beginPath();ctx.ellipse(0,2,16,5,0,0,Math.PI*2);ctx.stroke();
  for(const side of [-1,1]){
   ctx.beginPath();
   ctx.moveTo(side*8,0);
   ctx.quadraticCurveTo(side*15,-7,side*19,-4);
   ctx.stroke();
   ctx.beginPath();ctx.arc(side*20,-5,1.2,0,Math.PI*2);ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0,-2);ctx.lineTo(0,-8);ctx.stroke();
  ctx.beginPath();ctx.arc(0,-10,1.1,0,Math.PI*2);ctx.fill();
  ctx.restore();
 }
}
