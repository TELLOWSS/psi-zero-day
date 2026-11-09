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
  ctx.save();ctx.translate(echo.x,echo.y);
  ctx.globalAlpha=opacity;
  ctx.fillStyle='#d17ef0';ctx.strokeStyle='#8de6ff';
  ctx.lineWidth=3;ctx.shadowColor='#ef9dff';ctx.shadowBlur=10;
  ctx.beginPath();ctx.ellipse(0,0,37,13,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,28,8,0,0,Math.PI*2);ctx.stroke();
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
  ctx.strokeStyle='#9aeaf4';ctx.fillStyle='#d0f6fd';
  ctx.globalAlpha=.68;ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,2,21,6,0,0,Math.PI*2);ctx.stroke();
  for(const side of [-1,1]){
   ctx.beginPath();ctx.moveTo(side*12,-2);ctx.lineTo(side*20,-10);
   ctx.lineTo(side*25,-8);ctx.stroke();
   ctx.beginPath();ctx.arc(side*26,-11,1.8,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
 }
}
