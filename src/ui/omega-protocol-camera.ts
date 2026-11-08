import type {OmegaFieldPoint} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT,OMEGA_QUARTER_VIEW} from '../domain/omega-protocol-field';
export {OMEGA_QUARTER_VIEW} from '../domain/omega-protocol-field';

/**
 * A 3/4 world projection for the actual Watch-engine field.
 *
 * World movement/physics remain in original XY coordinates.
 * Only drawing uses skewed-horizontal / foreshortened-ground coordinates.
 * Actors can undo the vertical scale when their full-body sprite is drawn.
 */

export interface OmegaCameraState{
 readonly scale:number;
 readonly skewX:number;
 readonly groundYScale:number;
 readonly projectedOffsetX:number;
 readonly projectedOffsetY:number;
 readonly playerScreenX:number;
 readonly playerScreenY:number;
}
export function omegaProjectFieldPoint(point:OmegaFieldPoint):OmegaFieldPoint{
 return {x:point.x+OMEGA_QUARTER_VIEW.skewX*point.y,
         y:OMEGA_QUARTER_VIEW.groundYScale*point.y};
}
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
function cameraCenter(value:number,min:number,max:number,viewLength:number):number{
 if(viewLength>=max-min)return (min+max)/2;
 return clamp(value,min+viewLength/2,max-viewLength/2);
}
export function omegaQuarterViewCamera(
 actor:OmegaFieldPoint,viewWidth:number,viewHeight:number,
):OmegaCameraState{
 if(!Number.isFinite(actor.x)||!Number.isFinite(actor.y)||
    !Number.isFinite(viewWidth)||!Number.isFinite(viewHeight)||
    viewWidth<=0||viewHeight<=0)throw new RangeError('Invalid camera inputs');
 const {skewX,groundYScale}=OMEGA_QUARTER_VIEW;
 const boundLeft=Math.min(0,skewX*OMEGA_FIELD_HEIGHT);
 const boundRight=OMEGA_FIELD_WIDTH+Math.max(0,skewX*OMEGA_FIELD_HEIGHT);
 const boundTop=0,boundBottom=OMEGA_FIELD_HEIGHT*groundYScale;
 const projected=omegaProjectFieldPoint(actor);
 const fit=Math.max(viewWidth/(boundRight-boundLeft),viewHeight/(boundBottom-boundTop));
 const worldVisibleWidth=viewWidth/fit,worldVisibleHeight=viewHeight/fit;
 const centerX=cameraCenter(projected.x,boundLeft,boundRight,worldVisibleWidth);
 const centerY=cameraCenter(projected.y,boundTop,boundBottom,worldVisibleHeight);
 const projectedOffsetX=worldVisibleWidth/2-centerX;
 const projectedOffsetY=worldVisibleHeight/2-centerY;
 return {
  scale:fit,skewX,groundYScale,projectedOffsetX,projectedOffsetY,
  playerScreenX:fit*(projected.x+projectedOffsetX),
  playerScreenY:fit*(projected.y+projectedOffsetY),
 };
}
/** Apply only to world geometry and ground-foot positions, not HUD/controls. */
export function applyOmegaQuarterView(
 ctx:CanvasRenderingContext2D,camera:OmegaCameraState,
):void{
 ctx.scale(camera.scale,camera.scale);
 ctx.translate(camera.projectedOffsetX,camera.projectedOffsetY);
 ctx.transform(1,0,camera.skewX,camera.groundYScale,0,0);
}
