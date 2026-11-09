import type {OmegaHeading} from './omega-protocol-actor-render';

/**
 * AIRA V2 interim 8-direction cutout gait, not an approved painted sprite
 * animation. It samples the user's eight unique body views (no mirroring),
 * separates two leg cutouts near the hip seam and pivots them about the hip.
 * All coordinates below are in the 192x336 source-image space.
 *
 * 3 draw calls from ONE already-loaded source image, no runtime paid API,
 * no new image downloads, no native Watch movement/hitbox changes.
 */
export interface OmegaAiraV2WalkFrame{
 readonly phase:number;
 readonly frameIndex:number;
 readonly leftLegAngle:number;
 readonly rightLegAngle:number;
 readonly leftFootLift:number;
 readonly rightFootLift:number;
 readonly leftStrideX:number;
 readonly rightStrideX:number;
 readonly torsoX:number;
 readonly torsoY:number;
 readonly direction:OmegaHeading;
}
const sourceW=192,sourceH=336,cutY=179,overlapY=196;
const leftHipX=70,rightHipX=121;
const directions:Readonly<Record<OmegaHeading,number>>={
 E:1.08,SE:1.01,S:.87,SW:1.01,W:1.08,NW:.98,N:.83,NE:.98,
};
export const OMEGA_AIRA_V2_WALK_FRAMES=6;
export function omegaAiraV2WalkFrame(heading:OmegaHeading,phase:number):OmegaAiraV2WalkFrame{
 const safe=Number.isFinite(phase)?((phase%1)+1)%1:0;
 const step=Math.min(OMEGA_AIRA_V2_WALK_FRAMES-1,
  Math.floor(safe*OMEGA_AIRA_V2_WALK_FRAMES));
 // The actual measured gait phase is the only driver. No camera-time
 // leg cycling when the hero runs into a wall or the game is paused.
 const wave=Math.sin(safe*Math.PI*2);
 const strength=directions[heading];
 return {
  phase:safe,frameIndex:step,direction:heading,
  leftLegAngle:wave*.13*strength,
  rightLegAngle:-wave*.13*strength,
  leftFootLift:Math.max(0,wave)*11*strength,
  rightFootLift:Math.max(0,-wave)*11*strength,
  leftStrideX:wave*5*strength,
  rightStrideX:-wave*5*strength,
  torsoX:Math.sin(safe*Math.PI*4)*1.1,
  torsoY:-Math.abs(wave)*1.5,
 };
}
function legCut(
 ctx:CanvasRenderingContext2D,img:CanvasImageSource,
 side:'left'|'right',angle:number,lift:number,stride:number,
):void {
 const sx=side==='left'?0:96;
 const hip=side==='left'?leftHipX:rightHipX;
 ctx.save();
 ctx.translate(hip+stride,cutY-lift);
 ctx.rotate(angle);
 ctx.translate(-hip,-cutY);
 ctx.drawImage(img,sx,cutY,96,sourceH-cutY,sx,cutY,96,sourceH-cutY);
 ctx.restore();
}
/** Caller coordinates are boot anchored at 0,0 and already facing the
 * actual direction image. Emitting only image-based articulated frames
 * prevents a second fake shadow actor or copied directional art.
 */
export function drawOmegaAiraV2WalkRig(
 ctx:CanvasRenderingContext2D,img:CanvasImageSource,
 heading:OmegaHeading,phase:number,height=118,
):void{
 if(!Number.isFinite(height)||height<=0)return;
 const frame=omegaAiraV2WalkFrame(heading,phase);
 ctx.save();
 const scale=height/sourceH;
 ctx.scale(scale,scale);
 ctx.translate(-sourceW/2,-sourceH);
 // Legs FIRST. Whole top of original illustration overlaps the seam so
 // the hip remains visually continuous; boots keep the world-space pivot.
 legCut(ctx,img,'left',frame.leftLegAngle,frame.leftFootLift,frame.leftStrideX);
 legCut(ctx,img,'right',frame.rightLegAngle,frame.rightFootLift,frame.rightStrideX);
 ctx.save();
 ctx.translate(frame.torsoX,frame.torsoY);
 ctx.drawImage(img,0,0,sourceW,overlapY,0,0,sourceW,overlapY);
 ctx.restore();
 ctx.restore();
}
