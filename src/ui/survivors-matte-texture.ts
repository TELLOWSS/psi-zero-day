import {WORKFACE_WIDTH,WORKFACE_HEIGHT,type ApprovedForegroundMatte} from './survivors-stage-mattes';

export type MatteBounds=Pick<ApprovedForegroundMatte,'x'|'y'|'width'|'height'>;
/** Alpha is the ONLY information taken from the extracted art. Existing floor
 * pixels and the same world-space grade supply every visible colour. Baked once
 * per lighting/quality state, never read back during the game render loop. */
export function sourceMatchedMatte(
 source:HTMLImageElement,mask:HTMLImageElement,bounds:MatteBounds,
 paintGround?:(ctx:CanvasRenderingContext2D)=>void,
):HTMLCanvasElement|undefined {
 if(!source.naturalWidth||!mask.naturalWidth||!mask.naturalHeight||
  ![bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite)||bounds.width<=0||bounds.height<=0)return;
 const canvas=document.createElement('canvas');canvas.width=mask.naturalWidth;canvas.height=mask.naturalHeight;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 ctx.scale(canvas.width/bounds.width,canvas.height/bounds.height);ctx.translate(-bounds.x,-bounds.y);
 if(paintGround)paintGround(ctx);else ctx.drawImage(source,0,0,WORKFACE_WIDTH,WORKFACE_HEIGHT);
 ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
 ctx.globalCompositeOperation='source-over';return canvas;
}
export interface ForegroundTextureEntry {
 source:HTMLImageElement;mask:HTMLImageElement;texture?:HTMLCanvasElement;key?:string;
}
